import { Diagnostic } from "vscode-languageserver-types";
import { Section } from "../../configTree/section";
import { incorrectColors } from "../../messageUtil";
import { createDiagnostic } from "../../util";
import { requiredCondition } from "../utils/condition";
import { RelatedSettingsRule } from "../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Checks colors is less than thresholds by 1",
    check(section: Section): Diagnostic | void {
        let colorsValues;
        let thresholdsValues;

        if (!section.matchesConditions([
            requiredCondition("type", ["calendar", "treemap", "gauge"]),
            requiredCondition("mode", ["half", "default"])])) {
            return;
        }

        const colorsSetting = section.getSettingFromTree("colors");
        if (colorsSetting === undefined) {
            return;
        }

        const thresholdsSetting = section.getSettingFromTree("thresholds");
        if (thresholdsSetting === undefined) {
            return createDiagnostic(section.range.range,
                `thresholds is required if colors is specified`);
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
