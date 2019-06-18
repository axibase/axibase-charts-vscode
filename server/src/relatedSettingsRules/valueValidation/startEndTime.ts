import { Util } from "language-service/dist";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver-types";
import { Section } from "../../configTree/section";
import { RelatedSettingsRule } from "../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Checks start-time is greater than end-time",
    check(section: Section): Diagnostic | void {
        const end = section.getSettingFromTree("end-time");
        const start = section.getSettingFromTree("start-time");

        if (end === undefined || start === undefined) {
            return;
        }

        if (start.value >= end.value) {
            return Util.createDiagnostic(
                end.textRange,
                `${end.displayName} must be greater than ${start.displayName}`,
                DiagnosticSeverity.Error
            );
        }
    }
};

export default rule;
