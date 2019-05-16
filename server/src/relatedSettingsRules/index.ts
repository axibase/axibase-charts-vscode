import requiredSettings from "./presenceValidation/requiredSettings";
import { uselessSettingsForSeries, uselessSettingsForWidget } from "./presenceValidation/uselessSettings/index";
import { RelatedSettingsRule } from "./utils/interfaces";
import colorsThresholds from "./valueValidation/colorsThresholds";
import forecastAutoCountAndEigentripleLimit from "./valueValidation/forecastAutoCountAndEigentripleLimit";
import forecastEndTime from "./valueValidation/forecastEndTime";
import startEndTime from "./valueValidation/startEndTime";

const rulesBySection: Map<string, RelatedSettingsRule[]> = new Map<string, RelatedSettingsRule[]>([
    [
        "series", [
            colorsThresholds,
            forecastEndTime,
            forecastAutoCountAndEigentripleLimit,
            requiredSettings,
            uselessSettingsForSeries
        ]
    ],
    [
        "widget", [
            startEndTime,
            uselessSettingsForWidget
        ]
    ]
]);

export default rulesBySection;
