import { Diagnostic } from "vscode-languageserver";
import { RelatedSettingsRule } from "../configTree";
import { incorrectColors } from "../messageUtil";
import { sectionMatchConditionRequired } from "../requirement";
import { Section } from "../section";
import { createDiagnostic } from "../util";

const rule: RelatedSettingsRule = {
    name: "Check colors match thresholds",
    rule(section: Section): Diagnostic | void {
        let colorsValues;
        let thresholdsValues;

        const colorsSetting = section.getSettingFromTree("colors");
        const thresholdsSetting = section.getSettingFromTree("thresholds");

        if (colorsSetting === undefined || thresholdsSetting === undefined) {
            return;
        }

        if (!section.sectionMatchConditions([
            sectionMatchConditionRequired("type", ["calendar", "treemap", "gauge"]),
            sectionMatchConditionRequired("mode", ["half", "default"])
        ])) {
            return;
        }

        if (colorsSetting.values.length > 0) {
            colorsSetting.values.push(colorsSetting.value);
            colorsValues = colorsSetting.values;
        } else {
            /**
             * Converts 1) -> 2):
             * 1) colors = rgb(247,251,255), rgb(222,235,247), rgb(198,219,239)
             * 2) colors = rgb, rgb, rgb
             */
            colorsValues = colorsSetting.value.replace(/(\s*\d{3}\s*,?)/g, "");
            colorsValues = colorsValues.split(",").filter(s => s.trim() !== "");
        }
        if (thresholdsSetting.values.length > 0) {
            thresholdsSetting.values.push(thresholdsSetting.value);
            thresholdsValues = thresholdsSetting.values;
        } else {
            thresholdsValues = thresholdsSetting.value.split(",").filter(s => s.trim() !== "");
        }

        const expected = thresholdsValues.length - 1;
        if (colorsValues.length !== expected) {
            return createDiagnostic(colorsSetting.textRange,
                incorrectColors(`${colorsValues.length}`, `${expected}`));
        }
    }
};

export default rule;
