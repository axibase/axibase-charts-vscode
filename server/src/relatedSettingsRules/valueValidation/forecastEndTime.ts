import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { Section } from "../../configTree/section";
import { parseTimeValue } from "../../time";
import { createDiagnostic } from "../../util";
import { RelatedSettingsRule } from "../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Validates forecast-horizon/end-time values and checks forecast-horizon-end-time is greater than end-time",
    check(section: Section): Diagnostic[] | void {
        let forecast = section.getSettingFromTree("forecast-horizon-end-time");
        let end = section.getSettingFromTree("end-time");
        if (forecast === undefined && end === undefined) {
            return;
        }
        const errors: Diagnostic[] = [];
        let parsedEnd = parseTimeValue(end, section, errors);
        let parsedForecast = parseTimeValue(forecast, section, errors);
        if (parsedForecast != null && parsedEnd != null) {
            if (parsedEnd >= parsedForecast) {
                errors.push(createDiagnostic(
                    end.textRange,
                    `${forecast.displayName} must be greater than ${end.displayName}`,
                    DiagnosticSeverity.Error
                ));
            }
        }
        if (errors.length > 0) {
            return errors;
        }
    }
};

export default rule;
