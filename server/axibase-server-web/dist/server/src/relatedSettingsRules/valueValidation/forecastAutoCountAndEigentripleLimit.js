define(["require", "exports", "../../util"], function (require, exports, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rule = {
        name: "Checks forecast-ssa-group-auto-count is greater than forecast-ssa-decompose-eigentriple-limit",
        check(section) {
            const groupAutoCount = section.getSettingFromTree("forecast-ssa-group-auto-count");
            if (groupAutoCount === undefined) {
                return;
            }
            const forecastLimit = section.getSettingFromTree("forecast-ssa-decompose-eigentriple-limit");
            const eigentripleLimitValue = forecastLimit ?
                forecastLimit.value : util_1.getSetting("forecast-ssa-decompose-eigentriple-limit").defaultValue;
            if (eigentripleLimitValue <= groupAutoCount.value) {
                return util_1.createDiagnostic(groupAutoCount.textRange, `forecast-ssa-group-auto-count ` +
                    `must be less than forecast-ssa-decompose-eigentriple-limit (default 0)`);
            }
        }
    };
    exports.default = rule;
});
