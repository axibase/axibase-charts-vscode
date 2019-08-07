import { noUselessSettingsForSeries, noUselessSettingsForWidget } from "./presenceValidation/noUselessSettings/index";
import simultaneousTimeSettings from "./presenceValidation/noUselessSettings/simultaneousTimeSettings";
import requiredSettings from "./presenceValidation/requiredSettings";
import { RelatedSettingsRule } from "./utils/interfaces";
import colorsThresholds from "./valueValidation/colorsThresholds";
import forecastAutoCountAndEigentripleLimit from "./valueValidation/forecastAutoCountAndEigentripleLimit";
import forecastEndTime from "./valueValidation/forecastEndTime";
import forecastSsaGroupAutoUnion from "./valueValidation/forecastSsaGroupAutoUnion";
import forecastSsaGroupManualGroups from "./valueValidation/forecastSsaGroupManualGroups";
import forecastStartTime from "./valueValidation/forecastStartTime";
import startEndTime from "./valueValidation/startEndTime";

const rulesBySection: Map<string, RelatedSettingsRule[]> = new Map<string, RelatedSettingsRule[]>([
    [
        "series", [
            colorsThresholds,
            forecastEndTime,
            forecastStartTime,
            forecastAutoCountAndEigentripleLimit,
            requiredSettings,
            noUselessSettingsForSeries,
            forecastSsaGroupAutoUnion,
            forecastSsaGroupManualGroups
        ]
    ],
    [
        "widget", [
            startEndTime,
            noUselessSettingsForWidget,
            simultaneousTimeSettings
        ]
    ]
]);

export default rulesBySection;
