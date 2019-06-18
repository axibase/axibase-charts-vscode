var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "vscode-languageserver-types", "./defaultSetting", "./messageUtil", "./util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var vscode_languageserver_types_1 = require("vscode-languageserver-types");
    var defaultSetting_1 = require("./defaultSetting");
    var messageUtil_1 = require("./messageUtil");
    var util_1 = require("./util");
    exports.intervalUnits = [
        "nanosecond", "millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year",
    ];
    exports.calendarKeywords = [
        "current_day", "current_hour", "current_minute", "current_month", "current_quarter", "current_week",
        "current_year", "first_day", "first_vacation_day", "first_working_day", "friday", "last_vacation_day",
        "last_working_day", "monday", "next_day", "next_hour", "next_minute", "next_month", "next_quarter",
        "next_vacation_day", "next_week", "next_working_day", "next_year", "now", "previous_day", "previous_hour",
        "previous_minute", "previous_month", "previous_quarter", "previous_vacation_day", "previous_week",
        "previous_working_day", "previous_year", "saturday", "sunday", "thursday", "tuesday", "wednesday",
    ];
    var booleanKeywords = [
        "false", "no", "null", "none", "0", "off", "true", "yes", "on", "1",
    ];
    var booleanRegExp = new RegExp("^(?:" + booleanKeywords.join("|") + ")$");
    var calendarRegExp = new RegExp(
    // current_day
    "^(?:" + exports.calendarKeywords.join("|") + ")" +
        (
        // + 5 * minute
        "(?:[ \\t]*[-+][ \\t]*(?:\\d+|(?:\\d+)?\\.\\d+)[ \\t]*\\*[ \\t]*(?:" + exports.intervalUnits.join("|") + "))?$"));
    var integerRegExp = /^[-+]?\d+$/;
    var intervalRegExp = new RegExp(
    // -5 month, +3 day, .3 year, 2.3 week, all
    "^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:" + exports.intervalUnits.join("|") + "))|all)$");
    var localDateRegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12][0-9]|3[01])" +
        // 01:13:46.123, 11:26:52
        "(?: (?:[01]\\d|2[0-4]):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?(?:\\.\\d{1,9})?)?)?)?$");
    // 1, 5.2, 0.3, .9, -8, -0.5, +1.4
    var numberRegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;
    var zonedDateRegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])" +
        // T12:34:46.123, T23:56:18
        "[tT](?:[01]\\d|2[0-4]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:\\.\\d{1,9})?" +
        // Z, +0400, -05:00
        "(?:[zZ]|[+-](?:[01]\\d|2[0-4]):?(?:[0-5][0-9]))$");
    var calculatedRegExp = /[@$]\{.+\}/;
    /**
     * Tests the provided string with regular expressions
     * @param text the target string
     * @returns true if the string is date expression, false otherwise
     */
    function isDate(text) {
        return calendarRegExp.test(text) || localDateRegExp.test(text) || zonedDateRegExp.test(text);
    }
    var specificValueChecksMap = new Map([
        ["forecastssagroupmanualgroups", {
                errMsg: "Incorrect group syntax",
                isIncorrect: function (value) {
                    var regex = /^[\d\s,;-]+$/;
                    return !regex.test(value);
                }
            }],
        ["forecastssagroupautounion", {
                errMsg: "Incorrect group union syntax",
                isIncorrect: function (value) {
                    var regex = /^[a-z\s,;-]+$/;
                    return !regex.test(value);
                }
            }]
    ]);
    /**
     * In addition to DefaultSetting contains specific fields.
     */
    var Setting = /** @class */ (function (_super) {
        __extends(Setting, _super);
        function Setting(setting) {
            var _this = _super.call(this, setting) || this;
            /**
             * Setting value.
             */
            _this.value = "";
            /**
             * Setting values for multiline settings (mostly for colors and thresholds).
             */
            _this.values = [];
            return _this;
        }
        Object.defineProperty(Setting.prototype, "textRange", {
            get: function () {
                return this._textRange;
            },
            set: function (value) {
                this._textRange = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Checks the type of the setting and creates a corresponding diagnostic
         * @param range where the error should be displayed
         */
        Setting.prototype.checkType = function (range) {
            var _this = this;
            var result;
            // allows ${} and @{} expressions
            if (calculatedRegExp.test(this.value)) {
                return result;
            }
            switch (this.type) {
                case "string": {
                    if (!/\S/.test(this.value)) {
                        result = util_1.Util.createDiagnostic(range, this.displayName + " can not be empty");
                        break;
                    }
                    if (this.enum.length > 0) {
                        if (this.value.split(/\s*,\s*/).some(function (s) { return _this.enum.indexOf(s) < 0; })) {
                            var enumList = this.enum.sort().join("\n * ");
                            result = util_1.Util.createDiagnostic(range, this.displayName + " must contain only the following:\n * " + enumList);
                        }
                        break;
                    }
                    var specCheck = specificValueChecksMap.get(this.name);
                    if (specCheck && specCheck.isIncorrect(this.value)) {
                        result = util_1.Util.createDiagnostic(range, specCheck.errMsg);
                    }
                    break;
                }
                case "number": {
                    var persent = /(\d*)%/.exec(this.value);
                    if (this.name === "arrowlength" && persent) {
                        this.maxValue = typeof this.maxValue === "object" ? this.maxValue.value * 100 : this.maxValue * 100;
                        this.minValue = typeof this.minValue === "object" ? this.minValue.value * 100 : this.minValue * 100;
                        this.value = persent[1];
                    }
                    result = this.checkNumber(numberRegExp, this.displayName + " should be a real (floating-point) number.", range);
                    break;
                }
                case "integer": {
                    result = this.checkNumber(integerRegExp, this.displayName + " should be an integer number.", range);
                    break;
                }
                case "boolean": {
                    if (!booleanRegExp.test(this.value)) {
                        result = util_1.Util.createDiagnostic(range, this.displayName + " should be a boolean value. For example, " + this.example);
                    }
                    break;
                }
                case "enum": {
                    var index = this.findIndexInEnum(this.value);
                    // Empty enum means that the setting is not allowed
                    if (this.enum.length === 0) {
                        result = util_1.Util.createDiagnostic(range, messageUtil_1.illegalSetting(this.displayName));
                    }
                    else if (index < 0) {
                        if (/percentile/.test(this.value) && /statistic/.test(this.name)) {
                            result = this.checkPercentile(range);
                            break;
                        }
                        var enumList = this.enum.sort().join("\n * ")
                            .replace(/percentile\\.+/, "percentile(n)");
                        result = util_1.Util.createDiagnostic(range, this.displayName + " must be one of:\n * " + enumList);
                    }
                    break;
                }
                case "interval": {
                    if (!intervalRegExp.test(this.value)) {
                        var message = ".\nFor example, " + this.example + ". Supported units:\n * " + exports.intervalUnits.join("\n * ");
                        if (this.name === "updateinterval" && /^\d+$/.test(this.value)) {
                            result = util_1.Util.createDiagnostic(range, "Specifying the interval in seconds is deprecated.\nUse `count unit` format" + message, vscode_languageserver_types_1.DiagnosticSeverity.Warning);
                        }
                        else {
                            /**
                             * Check other allowed non-interval values
                             * (for example, period, summarize-period, group-period supports "auto")
                             */
                            if (this.enum.length > 0) {
                                if (this.findIndexInEnum(this.value) < 0) {
                                    result = util_1.Util.createDiagnostic(range, "Use " + this.enum.sort().join(", ") + " or `count unit` format" + message);
                                }
                            }
                            else {
                                result = util_1.Util.createDiagnostic(range, this.displayName + " should be set as `count unit`" + message);
                            }
                        }
                    }
                    break;
                }
                case "date": {
                    if (!isDate(this.value)) {
                        result = util_1.Util.createDiagnostic(range, this.displayName + " should be a date. For example, " + this.example);
                    }
                    break;
                }
                case "object": {
                    try {
                        JSON.parse(this.value);
                    }
                    catch (err) {
                        result = util_1.Util.createDiagnostic(range, "Invalid object specified: " + err.message);
                    }
                    break;
                }
                default: {
                    throw new Error(this.type + " is not handled");
                }
            }
            return result;
        };
        Setting.prototype.checkNumber = function (reg, message, range) {
            var example = " For example, " + this.example;
            if (!reg.test(this.value)) {
                return util_1.Util.createDiagnostic(range, "" + message + example);
            }
            var minValue = typeof this.minValue === "object" ? this.minValue.value : this.minValue;
            var minValueExcluded = typeof this.minValue === "object" ? this.minValue.excluded : false;
            var maxValue = typeof this.maxValue === "object" ? this.maxValue.value : this.maxValue;
            var maxValueExcluded = typeof this.maxValue === "object" ? this.maxValue.excluded : false;
            var left = minValueExcluded ? "(" : "[";
            var right = maxValueExcluded ? ")" : "]";
            if (minValueExcluded && +this.value <= minValue || +this.value < minValue ||
                maxValueExcluded && +this.value >= maxValue || +this.value > maxValue) {
                return util_1.Util.createDiagnostic(range, this.displayName + " should be in range " + left + minValue + ", " + maxValue + right + "." + example);
            }
            return undefined;
        };
        Setting.prototype.checkPercentile = function (range) {
            var result;
            var n = this.value.match(/[^percntil_()]+/);
            if (n && +n[0] >= 0 && +n[0] <= 100) {
                if (/_/.test(this.value)) {
                    result = util_1.Util.createDiagnostic(range, "Underscore is deprecated, use percentile(" + n[0] + ") instead", vscode_languageserver_types_1.DiagnosticSeverity.Warning);
                }
                else if (!new RegExp("\\(" + n[0] + "\\)").test(this.value)) {
                    result = util_1.Util.createDiagnostic(range, "Wrong usage. Expected: percentile(" + n[0] + ").\nCurrent: " + this.value);
                }
            }
            else {
                result = util_1.Util.createDiagnostic(range, "n must be a decimal number between [0, 100]. Current: " + (n ? n[0] : n));
            }
            return result;
        };
        Setting.prototype.findIndexInEnum = function (value) {
            var index = this.enum.findIndex(function (option) {
                return new RegExp("^" + option + "$", "i").test(value);
            });
            return index;
        };
        return Setting;
    }(defaultSetting_1.DefaultSetting));
    exports.Setting = Setting;
});
