import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { Section } from "../../../configTree/section";
import { uselessScope } from "../../../messageUtil";
import { createDiagnostic } from "../../../util";
import { Condition } from "../../utils/condition";
import { Check, RelatedSettingsRule } from "../../utils/interfaces";
import forSeries from "./forSeries";
import forWidget from "./forWidget";

function getRule(checksMap: Map<string, Condition[]>): Check {

    return (section: Section): Diagnostic[] | void => {
        const diagnostics: Diagnostic[] = [];
        checksMap.forEach((conditions: Condition[], dependent: string) => {
            const dependentSetting = section.getSettingFromTree(dependent);
            if (dependentSetting === undefined) {
                return;
            }
            const msg: string[] = conditions.map(condition => condition(section) as string).filter(m => m);
            if (msg.length > 0) {
                diagnostics.push(createDiagnostic(
                    dependentSetting.textRange,
                    uselessScope(dependentSetting.displayName, `${msg.join(", ")}`),
                    DiagnosticSeverity.Warning
                ));
            }
        });
        return diagnostics;
    };
}

export const uselessSettingsForWidget: RelatedSettingsRule = {
    check: getRule(forWidget),
    name: "Checks absence of useless settings in [widget]"
};

export const uselessSettingsForSeries: RelatedSettingsRule = {
    check: getRule(forSeries),
    name: "Checks absence of useless settings in [series]"
};
