define(["require", "exports", "vscode-languageserver", "../../util"], function (require, exports, vscode_languageserver_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rule = {
        name: "Checks forecast-horizon-end-time is greater than end-time",
        check(section) {
            let forecast = section.getSettingFromTree("forecast-horizon-end-time");
            if (forecast === undefined) {
                return;
            }
            let end = section.getSettingFromTree("end-time");
            if (end === undefined) {
                return;
            }
            if (end.value >= forecast.value) {
                return util_1.createDiagnostic(end.textRange, `${forecast.displayName} must be greater than ${end.displayName}`, vscode_languageserver_1.DiagnosticSeverity.Error);
            }
        }
    };
    exports.default = rule;
});
