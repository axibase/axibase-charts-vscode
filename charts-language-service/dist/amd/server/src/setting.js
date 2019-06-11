define(["require", "exports", "vscode-languageserver-types", "./defaultSetting", "./messageUtil", "./util"], function (require, exports, vscode_languageserver_types_1, defaultSetting_1, messageUtil_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    const booleanKeywords = [
        "false", "no", "null", "none", "0", "off", "true", "yes", "on", "1",
    ];
    const booleanRegExp = new RegExp(`^(?:${booleanKeywords.join("|")})$`);
    const calendarRegExp = new RegExp(
    // current_day
    `^(?:${exports.calendarKeywords.join("|")})` +
        // + 5 * minute
        `(?:[ \\t]*[-+][ \\t]*(?:\\d+|(?:\\d+)?\\.\\d+)[ \\t]*\\*[ \\t]*(?:${exports.intervalUnits.join("|")}))?$`);
    const integerRegExp = /^[-+]?\d+$/;
    const intervalRegExp = new RegExp(
    // -5 month, +3 day, .3 year, 2.3 week, all
    `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${exports.intervalUnits.join("|")}))|all)$`);
    const localDateRegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12][0-9]|3[01])" +
        // 01:13:46.123, 11:26:52
        "(?: (?:[01]\\d|2[0-4]):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?(?:\\.\\d{1,9})?)?)?)?$");
    // 1, 5.2, 0.3, .9, -8, -0.5, +1.4
    const numberRegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;
    const zonedDateRegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])" +
        // T12:34:46.123, T23:56:18
        "[tT](?:[01]\\d|2[0-4]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:\\.\\d{1,9})?" +
        // Z, +0400, -05:00
        "(?:[zZ]|[+-](?:[01]\\d|2[0-4]):?(?:[0-5][0-9]))$");
    const calculatedRegExp = /[@$]\{.+\}/;
    /**
     * Tests the provided string with regular expressions
     * @param text the target string
     * @returns true if the string is date expression, false otherwise
     */
    function isDate(text) {
        return calendarRegExp.test(text) || localDateRegExp.test(text) || zonedDateRegExp.test(text);
    }
    const specificValueChecksMap = new Map([
        ["forecastssagroupmanualgroups", {
                errMsg: "Incorrect group syntax",
                isIncorrect: (value) => {
                    const regex = /^[\d\s,;-]+$/;
                    return !regex.test(value);
                }
            }],
        ["forecastssagroupautounion", {
                errMsg: "Incorrect group union syntax",
                isIncorrect: (value) => {
                    const regex = /^[a-z\s,;-]+$/;
                    return !regex.test(value);
                }
            }]
    ]);
    /**
     * In addition to DefaultSetting contains specific fields.
     */
    class Setting extends defaultSetting_1.DefaultSetting {
        constructor(setting) {
            super(setting);
            /**
             * Setting value.
             */
            this.value = "";
            /**
             * Setting values for multiline settings (mostly for colors and thresholds).
             */
            this.values = [];
        }
        get textRange() {
            return this._textRange;
        }
        set textRange(value) {
            this._textRange = value;
        }
        /**
         * Checks the type of the setting and creates a corresponding diagnostic
         * @param range where the error should be displayed
         */
        checkType(range) {
            let result;
            // allows ${} and @{} expressions
            if (calculatedRegExp.test(this.value)) {
                return result;
            }
            switch (this.type) {
                case "string": {
                    if (!/\S/.test(this.value)) {
                        result = util_1.createDiagnostic(range, `${this.displayName} can not be empty`);
                        break;
                    }
                    if (this.enum.length > 0) {
                        if (this.value.split(/\s*,\s*/).some(s => this.enum.indexOf(s) < 0)) {
                            const enumList = this.enum.sort().join("\n * ");
                            result = util_1.createDiagnostic(range, `${this.displayName} must contain only the following:\n * ${enumList}`);
                        }
                        break;
                    }
                    const specCheck = specificValueChecksMap.get(this.name);
                    if (specCheck && specCheck.isIncorrect(this.value)) {
                        result = util_1.createDiagnostic(range, specCheck.errMsg);
                    }
                    break;
                }
                case "number": {
                    const persent = /(\d*)%/.exec(this.value);
                    if (this.name === "arrowlength" && persent) {
                        this.maxValue = typeof this.maxValue === "object" ? this.maxValue.value * 100 : this.maxValue * 100;
                        this.minValue = typeof this.minValue === "object" ? this.minValue.value * 100 : this.minValue * 100;
                        this.value = persent[1];
                    }
                    result = this.checkNumber(numberRegExp, `${this.displayName} should be a real (floating-point) number.`, range);
                    break;
                }
                case "integer": {
                    result = this.checkNumber(integerRegExp, `${this.displayName} should be an integer number.`, range);
                    break;
                }
                case "boolean": {
                    if (!booleanRegExp.test(this.value)) {
                        result = util_1.createDiagnostic(range, `${this.displayName} should be a boolean value. For example, ${this.example}`);
                    }
                    break;
                }
                case "enum": {
                    const index = this.findIndexInEnum(this.value);
                    // Empty enum means that the setting is not allowed
                    if (this.enum.length === 0) {
                        result = util_1.createDiagnostic(range, messageUtil_1.illegalSetting(this.displayName));
                    }
                    else if (index < 0) {
                        if (/percentile/.test(this.value) && /statistic/.test(this.name)) {
                            result = this.checkPercentile(range);
                            break;
                        }
                        const enumList = this.enum.sort().join("\n * ")
                            .replace(/percentile\\.+/, "percentile(n)");
                        result = util_1.createDiagnostic(range, `${this.displayName} must be one of:\n * ${enumList}`);
                    }
                    break;
                }
                case "interval": {
                    if (!intervalRegExp.test(this.value)) {
                        const message = `.\nFor example, ${this.example}. Supported units:\n * ${exports.intervalUnits.join("\n * ")}`;
                        if (this.name === "updateinterval" && /^\d+$/.test(this.value)) {
                            result = util_1.createDiagnostic(range, `Specifying the interval in seconds is deprecated.\nUse \`count unit\` format${message}`, vscode_languageserver_types_1.DiagnosticSeverity.Warning);
                        }
                        else {
                            /**
                             * Check other allowed non-interval values
                             * (for example, period, summarize-period, group-period supports "auto")
                             */
                            if (this.enum.length > 0) {
                                if (this.findIndexInEnum(this.value) < 0) {
                                    result = util_1.createDiagnostic(range, `Use ${this.enum.sort().join(", ")} or \`count unit\` format${message}`);
                                }
                            }
                            else {
                                result = util_1.createDiagnostic(range, `${this.displayName} should be set as \`count unit\`${message}`);
                            }
                        }
                    }
                    break;
                }
                case "date": {
                    if (!isDate(this.value)) {
                        result = util_1.createDiagnostic(range, `${this.displayName} should be a date. For example, ${this.example}`);
                    }
                    break;
                }
                case "object": {
                    try {
                        JSON.parse(this.value);
                    }
                    catch (err) {
                        result = util_1.createDiagnostic(range, `Invalid object specified: ${err.message}`);
                    }
                    break;
                }
                default: {
                    throw new Error(`${this.type} is not handled`);
                }
            }
            return result;
        }
        checkNumber(reg, message, range) {
            const example = ` For example, ${this.example}`;
            if (!reg.test(this.value)) {
                return util_1.createDiagnostic(range, `${message}${example}`);
            }
            const minValue = typeof this.minValue === "object" ? this.minValue.value : this.minValue;
            const minValueExcluded = typeof this.minValue === "object" ? this.minValue.excluded : false;
            const maxValue = typeof this.maxValue === "object" ? this.maxValue.value : this.maxValue;
            const maxValueExcluded = typeof this.maxValue === "object" ? this.maxValue.excluded : false;
            const left = minValueExcluded ? `(` : `[`;
            const right = maxValueExcluded ? `)` : `]`;
            if (minValueExcluded && +this.value <= minValue || +this.value < minValue ||
                maxValueExcluded && +this.value >= maxValue || +this.value > maxValue) {
                return util_1.createDiagnostic(range, `${this.displayName} should be in range ${left}${minValue}, ${maxValue}${right}.${example}`);
            }
            return undefined;
        }
        checkPercentile(range) {
            let result;
            const n = this.value.match(/[^percntil_()]+/);
            if (n && +n[0] >= 0 && +n[0] <= 100) {
                if (/_/.test(this.value)) {
                    result = util_1.createDiagnostic(range, `Underscore is deprecated, use percentile(${n[0]}) instead`, vscode_languageserver_types_1.DiagnosticSeverity.Warning);
                }
                else if (!new RegExp(`\\(${n[0]}\\)`).test(this.value)) {
                    result = util_1.createDiagnostic(range, `Wrong usage. Expected: percentile(${n[0]}).
Current: ${this.value}`);
                }
            }
            else {
                result = util_1.createDiagnostic(range, `n must be a decimal number between [0, 100]. Current: ${n ? n[0] : n}`);
            }
            return result;
        }
        findIndexInEnum(value) {
            const index = this.enum.findIndex((option) => new RegExp(`^${option}$`, "i").test(value));
            return index;
        }
    }
    exports.Setting = Setting;
});
