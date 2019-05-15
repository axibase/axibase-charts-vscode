import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { RelatedSettingsRule } from "../configTree";
import { Section } from "../section";
import { createDiagnostic } from "../util";

const rule: RelatedSettingsRule = {
    name: "Validate forecast-horizon-end-time and end-time",
    rule(section: Section): Diagnostic | void {
        let forecast = section.getSettingFromTree("forecast-horizon-end-time");
        let end = section.getSettingFromTree("end-time");

        if (end === undefined || forecast === undefined) {
            return;
        }

        if (end.value >= forecast.value) {
            return createDiagnostic(
                end.textRange,
                `${forecast.displayName} must be greater than ${end.displayName}`,
                DiagnosticSeverity.Error
            );
        }
    }
};

export default rule;
