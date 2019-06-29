import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { Section } from "../../../configTree/section";
import { simultaneousTimeSettingsWarning } from "../../../messageUtil";
import { createDiagnostic } from "../../../util";
import { RelatedSettingsRule } from "../../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Start-time, end-time and timespan mustn't be declared sumultaneously",
    check(section: Section): Diagnostic | void {
        const startTime = section.getSettingFromTree("start-time");
        const endTime = section.getSettingFromTree("end-time");
        const timespan = section.getSettingFromTree("timespan");

        if (startTime && endTime && timespan) {
            return createDiagnostic(
                section.range.range,
                simultaneousTimeSettingsWarning(),
                DiagnosticSeverity.Warning
            );
        }
    }
};

export default rule;
