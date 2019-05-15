import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { RelatedSettingsRule } from "../configTree";
import { Section } from "../section";
import { createDiagnostic } from "../util";

const rule: RelatedSettingsRule = {
    name: "Validate start-time and end-time",
    rule(section: Section): Diagnostic | void {
        const end = section.getSettingFromTree("end-time");
        const start = section.getSettingFromTree("start-time");

        if (end === undefined || start === undefined) {
            return;
        }

        if (start.value >= end.value) {
            return createDiagnostic(
                end.textRange,
                `${end.displayName} must be greater than ${start.displayName}`,
                DiagnosticSeverity.Error
            );
        }
    }
};

export default rule;
