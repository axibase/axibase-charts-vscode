define(["require", "exports", "vscode-languageserver-types", "../../util"], function (require, exports, vscode_languageserver_types_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rule = {
        name: "Checks start-time is greater than end-time",
        check(section) {
            const end = section.getSettingFromTree("end-time");
            const start = section.getSettingFromTree("start-time");
            if (end === undefined || start === undefined) {
                return;
            }
            if (start.value >= end.value) {
                return util_1.createDiagnostic(end.textRange, `${end.displayName} must be greater than ${start.displayName}`, vscode_languageserver_types_1.DiagnosticSeverity.Error);
            }
        }
    };
    exports.default = rule;
});
