import {
    Requirement,
    sectionMatchConditionRequired, sectionMatchConditionUseless,
} from "./requirement";

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
const relatedSettings: Requirement[] = [
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
 * Returns object from relatedSettings based on setting.displayName.
 * @param settingName setting.displayName
 */
export function getRequirement(settingName: string): Requirement | undefined {
    return relatedSettings.find(req => {
        return Array.isArray(req.dependent) ? req.dependent.includes(settingName) : req.dependent === settingName;
    });
}
