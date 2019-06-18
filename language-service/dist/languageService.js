(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./completionProvider"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var completionProvider_1 = require("./completionProvider");
    var LanguageService = /** @class */ (function () {
        function LanguageService(resourcesProvider) {
            this.resourcesProvider = resourcesProvider;
        }
        LanguageService.prototype.getCompletionProvider = function (textDocument, position) {
            return new completionProvider_1.CompletionProvider(textDocument, position, this.resourcesProvider);
        };
        return LanguageService;
    }());
    exports.LanguageService = LanguageService;
});
