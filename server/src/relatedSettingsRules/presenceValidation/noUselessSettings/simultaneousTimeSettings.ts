import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { Section } from "../../../configTree/section";
import { createDiagnostic } from "../../../util";
import { RelatedSettingsRule } from "../../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Start-time, end-time and timespan mustn't be declared sumultaneously",
    check(section: Section): Diagnostic | void {
        const startTime = section.getSettingFromTree("start-time");
        const endTime = section.getSettingFromTree("end-time");
        const timespan = section.getSettingFromTree("timespan");
        const allSettingsPresent = [startTime, endTime, timespan].every(setting => {
            return setting !== undefined;
        });

        if (allSettingsPresent) {
            return createDiagnostic(
                startTime.textRange,
                `${startTime.displayName}, ${endTime.displayName} and ${timespan.displayName}` +
                ` mustn't be declared simultaneously. ${timespan.displayName} will be ignored.`,
                DiagnosticSeverity.Warning
            );
        }
    }
};

export default rule;
