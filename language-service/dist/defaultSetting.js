var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./setting"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var setting_1 = require("./setting");
    /**
     * Holds the description of a setting and corresponding methods.
     */
    var DefaultSetting = /** @class */ (function () {
        function DefaultSetting(setting) {
            /**
             * A brief description for the setting
             */
            this.description = "";
            /**
             * User-friendly setting name like 'refresh-interval'
             */
            this.displayName = "";
            /**
             * Array containing all possible values. RegExp is supported
             */
            this.enum = [];
            /**
             * Example value for the setting. Should not equal to the default value
             */
            this.example = "";
            /**
             * The settings in this array must not be declared simultaneously with the current
             */
            this.excludes = [];
            /**
             * The maximum allowed value for the setting
             */
            this.maxValue = Infinity;
            /**
             * The minimum allowed value for the setting
             */
            this.minValue = -Infinity;
            /**
             * Is the setting allowed to be repeated
             */
            this.multiLine = false;
            /**
             * Inner setting name. Lower-cased, without any symbols except alphabetical.
             * For example, "refreshinterval"
             */
            this.name = "";
            /**
             * The type of the setting.
             * Possible values: string, number, integer, boolean, enum, interval, date
             */
            this.type = "";
            /**
             * Type of the widget were setting is applicable, for example,
             * gradient-count is applicable for gauge, treemap and calendar.
             */
            this.widget = [];
            this.overrideCache = [];
            Object.assign(this, setting);
            this.enum = this.enum.map(function (v) { return v.toLowerCase(); });
            this.name = DefaultSetting.clearSetting(this.displayName);
            if (this.override) {
                for (var scope in this.override) {
                    if (this.override.hasOwnProperty(scope)) {
                        this.overrideCache.push({
                            setting: this.override[scope],
                            test: this.getOverrideTest(scope),
                        });
                    }
                }
            }
        }
        /**
         * Create an instance of setting with matching overrides applied.
         * If no override can be applied returns this instanse.
         * @param scope Configuration scope where setting exist
         */
        DefaultSetting.prototype.applyScope = function (scope) {
            if (this.override == null) {
                return this;
            }
            var matchingOverrides = this.overrideCache
                .filter(function (override) { return override.test(scope); })
                .map(function (override) { return override.setting; });
            if (matchingOverrides.length > 0) {
                var copy = Object.create(setting_1.Setting.prototype);
                return Object.assign.apply(Object, __spread([copy, this], matchingOverrides));
            }
            else {
                return this;
            }
        };
        /**
         * Generates a string containing fully available information about the setting
         */
        DefaultSetting.prototype.toString = function () {
            // TODO: describe a script which is allowed as the setting value
            if (this.description == null) {
                return "";
            }
            var result = this.description + "  \n\n";
            if (this.example != null && this.example !== "") {
                result += "Example: " + this.displayName + " = " + this.example + "  \n";
            }
            if (this.type != null && this.type !== "") {
                result += "Type: " + this.type + "  \n";
            }
            if (this.defaultValue != null && this.defaultValue !== "") {
                result += "Default value: " + this.defaultValue + "  \n";
            }
            if (this.enum == null && this.enum.length === 0) {
                result += "Possible values: " + this.enum.join() + "  \n";
            }
            if (this.excludes != null && this.excludes.length !== 0) {
                result += "Can not be specified with: " + this.excludes.join() + "  \n";
            }
            if (this.maxValue != null && this.maxValue !== Infinity) {
                result += "Maximum: " + this.maxValue + "  \n";
            }
            if (this.minValue != null && this.minValue !== -Infinity) {
                result += "Minimum: " + this.minValue + "  \n";
            }
            if (this.section != null && this.section.length !== 0) {
                result += "Allowed in section: " + this.section + "  \n";
            }
            var widgets = "all";
            if (typeof this.widget !== "string" && this.widget.length > 0) {
                widgets = this.widget.join(", ");
            }
            else if (this.widget.length > 0) {
                widgets = this.widget;
            }
            result += "Allowed in widgets: " + widgets + "  \n";
            return result;
        };
        DefaultSetting.prototype.getOverrideTest = function (scopeSrc) {
            var scopeKeys = ["widget", "section"];
            var scopeSrcExtracted = /^\[(.*)\]$/.exec(scopeSrc);
            if (scopeSrcExtracted == null) {
                throw new Error("Wrong override scope format");
            }
            var source = "return !!(" + scopeSrcExtracted[1] + ");";
            var compiledScope = new Function(scopeKeys.join(), source);
            return function (scope) {
                try {
                    var values = scopeKeys.map(function (key) { return scope[key]; });
                    return compiledScope.apply(void 0, values);
                }
                catch (error) {
                    console.error("In '" + scopeSrc + "' :: " + error);
                }
            };
        };
        /**
         * Lowercases the string and deletes non-alphabetic characters
         * @param str string to be cleared
         * @returns cleared string
         */
        DefaultSetting.clearSetting = function (str) {
            return str.toLowerCase().replace(/[^a-z]/g, "");
        };
        /**
         * Lowercases the value of setting
         * @param str string to be cleared
         * @returns cleared string
         */
        DefaultSetting.clearValue = function (str) { return str.toLowerCase(); };
        return DefaultSetting;
    }());
    exports.DefaultSetting = DefaultSetting;
});
