define(["require", "exports", "./presenceValidation/noUselessSettings/index", "./presenceValidation/requiredSettings", "./valueValidation/colorsThresholds", "./valueValidation/forecastAutoCountAndEigentripleLimit", "./valueValidation/forecastEndTime", "./valueValidation/startEndTime"], function (require, exports, index_1, requiredSettings_1, colorsThresholds_1, forecastAutoCountAndEigentripleLimit_1, forecastEndTime_1, startEndTime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rulesBySection = new Map([
        [
            "series", [
                colorsThresholds_1.default,
                forecastEndTime_1.default,
                forecastAutoCountAndEigentripleLimit_1.default,
                requiredSettings_1.default,
                index_1.noUselessSettingsForSeries
            ]
        ],
        [
            "widget", [
                startEndTime_1.default,
                index_1.noUselessSettingsForWidget
            ]
        ]
    ]);
    exports.default = rulesBySection;
});
