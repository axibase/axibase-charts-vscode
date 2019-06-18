(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./completionProvider", "./defaultSetting", "./languageService", "./resourcesProviderBase", "./setting", "./util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var completionProvider_1 = require("./completionProvider");
    exports.CompletionProvider = completionProvider_1.CompletionProvider;
    var defaultSetting_1 = require("./defaultSetting");
    exports.DefaultSetting = defaultSetting_1.DefaultSetting;
    var languageService_1 = require("./languageService");
    exports.LanguageService = languageService_1.LanguageService;
    var resourcesProviderBase_1 = require("./resourcesProviderBase");
    exports.ResourcesProviderBase = resourcesProviderBase_1.ResourcesProviderBase;
    var setting_1 = require("./setting");
    exports.Setting = setting_1.Setting;
    var util_1 = require("./util");
    exports.Util = util_1.Util;
});
