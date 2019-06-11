define(["require", "exports", "vscode-languageserver-types", "../../../messageUtil", "../../../util", "./forSeries", "./forWidget"], function (require, exports, vscode_languageserver_types_1, messageUtil_1, util_1, forSeries_1, forWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getRule(checksMap) {
        return (section) => {
            const diagnostics = [];
            checksMap.forEach((conditions, dependent) => {
                const dependentSetting = section.getSettingFromTree(dependent);
                if (dependentSetting === undefined) {
                    return;
                }
                const msg = conditions.map(condition => condition(section)).filter(m => m);
                if (msg.length > 0) {
                    diagnostics.push(util_1.createDiagnostic(dependentSetting.textRange, messageUtil_1.uselessScope(dependentSetting.displayName, `${msg.join(", ")}`), vscode_languageserver_types_1.DiagnosticSeverity.Warning));
                }
            });
            return diagnostics;
        };
    }
    exports.noUselessSettingsForWidget = {
        check: getRule(forWidget_1.default),
        name: "Checks absence of useless settings in [widget]"
    };
    exports.noUselessSettingsForSeries = {
        check: getRule(forSeries_1.default),
        name: "Checks absence of useless settings in [series]"
    };
});
