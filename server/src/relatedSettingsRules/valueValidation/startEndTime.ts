import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { Section } from "../../configTree/section";
import { createDiagnostic, parseTimeValue } from "../../util";
import { RelatedSettingsRule } from "../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Validates start/end-time values and checks start-time is greater than end-time",
    check(section: Section): Diagnostic[] | void {
        const end = section.getSettingFromTree("end-time");
        const start = section.getSettingFromTree("start-time");
        if (end === undefined && start === undefined) {
            return;
        }
        const errors: Diagnostic[] = [];
        let parsedEnd = parseTimeValue(end, section, errors);
        let parsedStart = parseTimeValue(start, section, errors);
        if (parsedStart != null && parsedEnd != null) {
            if (parsedStart >= parsedEnd) {
                errors.push(createDiagnostic(
                    end.textRange,
                    `${end.displayName} must be greater than ${start.displayName}`,
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
