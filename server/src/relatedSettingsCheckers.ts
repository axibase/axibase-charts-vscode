import { Diagnostic } from "vscode-languageserver";
import { incorrectColors } from "./messageUtil";
import {
    Requirement,
    sectionMatchConditionRequired,
    sectionMatchConditionUseless
} from "./requirement";
import { Setting } from "./setting";
import { createDiagnostic } from "./util";

/**
 * Related settings requirements
 *
 * If `requiredIfConditions` !== null OR `requiredAnyIfConditions` !== null,
 * the section will be checked for match to `conditions`; if section matches conditions, then:
 *  1) setting, specified in `requiredIfConditions` is required for this section;
 *  2) required at least one setting from `requiredAnyIfConditions`.
 * `requiredIfConditions` can not be specified simultaneously with `requiredAnyIfConditions`.
 *
 * If `requiredIfConditions` == null AND `requiredAnyIfConditions` == null,
 * the section will be checked for applicability of any of `dependent`;
 * if any setting from `dependent` is declared in the section, then section will be checked for match to `conditions`.
 */
export const relatedSettings: Requirement[] = [
    {
        /**
         * If "type" is "calendar", "treemap " or "gauge" and mode is "half" or "default",
         * "colors" and "thresholds" are applicable, and if "colors" are specified, the "thresholds" are required.
         */
        conditions: [
            sectionMatchConditionRequired("type", ["calendar", "treemap", "gauge"]),
            sectionMatchConditionRequired("mode", ["half", "default"])
        ],
        dependent: "colors",
        requiredIfConditions: "thresholds"
    },
    {
        conditions: [
            sectionMatchConditionRequired("type", ["chart"]),
            sectionMatchConditionRequired("mode", ["column", "column-stack"])
        ],
        dependent: "forecast-style",
        requiredIfConditions: "data-type"
    },
    {
        conditions: [
            sectionMatchConditionRequired("type", ["chart"])
        ],
        dependent: "forecast-ssa-group-auto-count",
        requiredIfConditions: "forecast-ssa-decompose-eigentriple-limit"
    },
    {
        /**
         * If "type=chart" and "forecast-horizon-start-time" is specified,
         * any of "forecast-horizon-end-time", "forecast-horizon-interval",
         * "forecast-horizon-length" is required in [series].
         */
        conditions: [
            sectionMatchConditionRequired("type", ["chart"])
        ],
        dependent: "forecast-horizon-start-time",
        requiredAnyIfConditions: ["forecast-horizon-end-time", "forecast-horizon-interval", "forecast-horizon-length"]
    },
    {
        /**
         * If "type=chart" and "mode" is NOT "column-stack" or "column",
         * settings "negative-style" and "current-period-style" are useless.
         */
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("mode", ["column-stack", "column"])
        ],
        dependent: ["negative-style", "current-period-style"]
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("server-aggregate", ["false"])
        ],
        dependent: "moving-average"
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["calendar", "treemap", "gauge"]),
            sectionMatchConditionUseless("mode", ["half", "default"])
        ],
        dependent: ["ticks", "color-range", "gradient-count"]
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("forecast-arima-auto", ["false"])
        ],
        dependent: ["forecast-arima-auto-regression-interval", "forecast-arima-d", "forecast-arima-p"]
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("forecast-hw-auto", ["false"])
        ],
        dependent: ["forecast-hw-alpha", "forecast-hw-beta", "forecast-hw-gamma"]
    },
    {
        dependent: "table", requiredIfConditions: "attribute"
    },
    {
        dependent: "attribute", requiredIfConditions: "table"
    },
    {
        dependent: "column-alert-style", requiredIfConditions: "column-alert-expression"
    },
    {
        dependent: "alert-style", requiredIfConditions: "alert-expression"
    },
    {
        dependent: "link-alert-style", requiredIfConditions: "alert-expression"
    },
    {
        dependent: "node-alert-style", requiredIfConditions: "alert-expression"
    },
    {
        dependent: "icon-alert-style", requiredIfConditions: "icon-alert-expression"
    },
    {
        dependent: "icon-alert-expression", requiredIfConditions: "icon"
    },
    {
        dependent: "icon-color", requiredIfConditions: "icon"
    },
    {
        dependent: "icon-position", requiredIfConditions: "icon"
    },
    {
        dependent: "icon-size", requiredIfConditions: "icon"
    },
    {
        dependent: "caption-style", requiredIfConditions: "caption"
    }
];

/**
 * Check the relationship between thresholds and colors:
 * in "gauge", "calendar", "treemap" number of colors (if specified) must be equal to number of thresholds minus 1.
 */
export function checkColorsMatchTreshold(colorsSetting: Setting, thresholdsSetting: Setting): Diagnostic | undefined {
    let colorsValues;
    let thresholdsValues;
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
        return createDiagnostic(colorsSetting.textRange, incorrectColors(`${colorsValues.length}`, `${expected}`));
    } else {
        return undefined;
    }
}
