define("Field", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-module name="Field"/>
    /**
     * Represents a field in a script setting.
     * For example, `max` is a field in `alert-expression` setting
     */
    class Field {
        constructor(type, name, description = "", args = [], required = true) {
            this.type = type;
            this.name = name;
            this.args = args;
            this.description = description;
            this.required = required;
        }
    }
    exports.Field = Field;
});
define("PossibleValue", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <amd-module name="PossibleValue"/>
    class PossibleValue {
        constructor(value, detail) {
            /**
             * Description of value
             */
            this.detail = "";
            this.value = value;
            this.detail = detail;
        }
    }
    exports.PossibleValue = PossibleValue;
});
define("Script", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Script {
        constructor(returnValue, fields = []) {
            this.returnValue = returnValue;
            this.fields = fields;
        }
    }
    exports.Script = Script;
});
/// <amd-module name="MessageUtil"/>
define("MessageUtil", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Creates a error message for unknown setting or value.
     * @param found the variant found in the user's text
     * @returns message with or without a suggestion
     */
    exports.unknownToken = (found) => `${found} is unknown.`;
    exports.deprecatedTagSection = `Replace [tag] sections with [tags].
Enclose the tag name in double quotes in case it contains special characters.

[tag]
  name = k
  value = v
[tag]
  name = my column
  value = my value

[tags]
  k = v
  "my column" = my value
`;
    exports.settingsWithWhitespaces = (found) => `The setting "${found}" contains whitespaces.\nReplace spaces with hyphens.`;
    exports.tagNameWithWhitespaces = (found) => `The tag name ${found} contains whitespaces. Wrap it in double quotes.`;
    exports.settingNameInTags = (found) => `${found} is interpreted as a series tag and is sent to the\nserver. ` +
        `Move the setting outside of the [tags] section or\n` +
        "enclose in double-quotes to send it to the server without\na warning.";
    exports.uselessScope = (found, msg) => `${found} setting is appplied only if ${msg}.`;
    exports.incorrectColors = (found, msg) => `Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.
Current: ${found}, expected: ${msg}`;
    exports.illegalSetting = (found) => `${found} setting is not allowed here.`;
    /**
     * RegExp for: 'csv from <url>'
     */
    const CSV_FROM_URL_MISSING_NAME_PATTERN = /(^[ \t]*csv[ \t]+)[ \t]*(from)/;
    /**
     * If SCV pattern didn't match any known RegExp, compose error message
     * @param line line of code instruction
     * @returns csv error message
     */
    exports.getCsvErrorMessage = (line) => {
        return (CSV_FROM_URL_MISSING_NAME_PATTERN.test(line)) ? `<name> in 'csv <name> from <url>' is missing` :
            `The line should contain a '=' or 'from' keyword`;
    };
    exports.noRequiredSetting = (dependent, required) => `${required} is required if ${dependent} is specified`;
    exports.noRequiredSettings = (dependent, required) => `${dependent} has effect only with one of the following:
 * ${required.join("\n * ")}`;
    exports.noMatching = (dependent, required) => `${dependent} has no matching ${required}`;
    exports.lineFeedRequired = (dependent) => `A linefeed character after '${dependent}' keyword is required`;
});
define("Util", ["require", "exports", "vscode-languageserver-types", "Resources", "Setting"], function (require, exports, vscode_languageserver_types_1, resources_1, setting_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DIAGNOSTIC_SOURCE = "Axibase Charts";
    /**
     * @param value the value to find
     * @param map the map to search
     * @returns true if at least one value in map is/contains the wanted value
     */
    function isInMap(value, map) {
        if (value == null) {
            return false;
        }
        for (const array of map.values()) {
            for (const item of array) {
                if ((Array.isArray(item) && item.includes(value)) || (item === value)) {
                    return true;
                }
            }
        }
        return false;
    }
    exports.isInMap = isInMap;
    /**
     * @param target array of aliases
     * @param array array to perform the search
     * @returns true, if array contains a value from target
     */
    function isAnyInArray(target, array) {
        for (const item of target) {
            if (array.includes(item)) {
                return true;
            }
        }
        return false;
    }
    exports.isAnyInArray = isAnyInArray;
    /**
     * Clears the passed argument and looks for a setting with the same name
     * @param name name of the wanted setting
     * @param range TextRange of the setting in text.
     * @returns the wanted setting or undefined if not found
     */
    function getSetting(name, range) {
        const clearedName = setting_1.Setting.clearSetting(name);
        const defaultSetting = resources_1.settingsMap.get(clearedName);
        if (defaultSetting === undefined) {
            return undefined;
        }
        const setting = new setting_1.Setting(defaultSetting);
        if (range) {
            setting.textRange = range;
        }
        return setting;
    }
    exports.getSetting = getSetting;
    /**
     * Counts CSV columns using RegExp.
     * @param line a CSV-formatted line
     * @returns number of CSV columns in the line
     */
    function countCsvColumns(line) {
        if (line.length === 0) {
            return 0;
        }
        const lineWithoutEscapes = line.replace(/(['"]).+\1/g, ""); // remove strings in quotes "6,3" or "6 3"
        return lineWithoutEscapes.split(",").length;
    }
    exports.countCsvColumns = countCsvColumns;
    /**
     * Short-hand to create a diagnostic with undefined code and a standardized source
     * @param range Where is the mistake?
     * @param severity How severe is that problem?
     * @param message What message should be passed to the user?
     */
    function createDiagnostic(range, message, severity = vscode_languageserver_types_1.DiagnosticSeverity.Error) {
        return vscode_languageserver_types_1.Diagnostic.create(range, message, severity, undefined, DIAGNOSTIC_SOURCE);
    }
    exports.createDiagnostic = createDiagnostic;
    /**
     * Replaces all comments with spaces.
     * We need to remember places of statements in the original configuration,
     * that's why it is not possible to delete all comments, whereas they must be ignored.
     * @param text the text to replace comments
     * @returns the modified text
     */
    function deleteComments(text) {
        let content = text;
        const multiLine = /\/\*[\s\S]*?\*\//g;
        const oneLine = /^[ \t]*#.*/mg;
        let match = multiLine.exec(content);
        if (match === null) {
            match = oneLine.exec(content);
        }
        while (match !== null) {
            const newLines = match[0].split("\n").length - 1;
            const spaces = Array(match[0].length)
                .fill(" ")
                .concat(Array(newLines).fill("\n"))
                .join("");
            content = `${content.substr(0, match.index)}${spaces}${content.substr(match.index + match[0].length)}`;
            match = multiLine.exec(content);
            if (match === null) {
                match = oneLine.exec(content);
            }
        }
        return content;
    }
    exports.deleteComments = deleteComments;
    /**
     * Replaces scripts body with newline character
     * @param text the text to perform modifications
     * @returns the modified text
     */
    function deleteScripts(text) {
        return text.replace(/\bscript\b([\s\S]+?)\bendscript\b/g, "script\nendscript");
    }
    exports.deleteScripts = deleteScripts;
    /**
     * @returns true if the current line contains white spaces or nothing, false otherwise
     */
    function isEmpty(str) {
        return /^\s*$/.test(str);
    }
    exports.isEmpty = isEmpty;
    /**
     * Creates a diagnostic for a repeated setting. Warning if this setting was
     * multi-line previously, but now it is deprecated, error otherwise.
     * @param range The range where the diagnostic will be displayed
     * @param declaredAbove The setting, which has been declared earlier
     * @param current The current setting
     */
    function repetitionDiagnostic(range, declaredAbove, current) {
        const diagnosticSeverity = (["script", "thresholds", "colors"].includes(current.name)) ?
            vscode_languageserver_types_1.DiagnosticSeverity.Warning : vscode_languageserver_types_1.DiagnosticSeverity.Error;
        let message;
        switch (current.name) {
            case "script": {
                message =
                    "Multi-line scripts are deprecated.\nGroup multiple scripts into blocks:\nscript\nendscript";
                break;
            }
            case "thresholds": {
                message = `Replace multiple \`thresholds\` settings with one, for example:
thresholds = 0
thresholds = 60
thresholds = 80

thresholds = 0, 60, 80`;
                declaredAbove.values.push(current.value);
                break;
            }
            case "colors": {
                message = `Replace multiple \`colors\` settings with one, for example:
colors = red
colors = yellow
colors = green

colors = red, yellow, green`;
                declaredAbove.values.push(current.value);
                break;
            }
            default:
                message = `${declaredAbove.displayName} is already defined`;
        }
        return createDiagnostic(range, message, diagnosticSeverity);
    }
    exports.repetitionDiagnostic = repetitionDiagnostic;
    /**
     * Creates Range object.
     *
     * @param start - The starting position in the string
     * @param length - Length of the word to be highlighted
     * @param lineNumber - Number of line, where is the word to be highlighted
     * @returns Range object with start equal to `start` and end equal to `start+length` and line equal to `lineNumber`
     */
    function createRange(start, length, lineNumber) {
        return vscode_languageserver_types_1.Range.create(vscode_languageserver_types_1.Position.create(lineNumber, start), vscode_languageserver_types_1.Position.create(lineNumber, start + length));
    }
    exports.createRange = createRange;
});
define("Setting", ["require", "exports", "vscode-languageserver-types", "DefaultSetting", "MessageUtil", "Util"], function (require, exports, vscode_languageserver_types_2, defaultSetting_1, messageUtil_1, util_1) {
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
                            result = util_1.createDiagnostic(range, `Specifying the interval in seconds is deprecated.\nUse \`count unit\` format${message}`, vscode_languageserver_types_2.DiagnosticSeverity.Warning);
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
                    result = util_1.createDiagnostic(range, `Underscore is deprecated, use percentile(${n[0]}) instead`, vscode_languageserver_types_2.DiagnosticSeverity.Warning);
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
define("DefaultSetting", ["require", "exports", "Setting"], function (require, exports, setting_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Holds the description of a setting and corresponding methods.
     */
    class DefaultSetting {
        constructor(setting) {
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
            this.enum = this.enum.map((v) => v.toLowerCase());
            this.name = DefaultSetting.clearSetting(this.displayName);
            if (this.override) {
                for (const scope in this.override) {
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
        applyScope(scope) {
            if (this.override == null) {
                return this;
            }
            let matchingOverrides = this.overrideCache
                .filter((override) => override.test(scope))
                .map((override) => override.setting);
            if (matchingOverrides.length > 0) {
                let copy = Object.create(setting_2.Setting.prototype);
                return Object.assign(copy, this, ...matchingOverrides);
            }
            else {
                return this;
            }
        }
        /**
         * Generates a string containing fully available information about the setting
         */
        toString() {
            // TODO: describe a script which is allowed as the setting value
            if (this.description == null) {
                return "";
            }
            let result = `${this.description}  \n\n`;
            if (this.example != null && this.example !== "") {
                result += `Example: ${this.displayName} = ${this.example}  \n`;
            }
            if (this.type != null && this.type !== "") {
                result += `Type: ${this.type}  \n`;
            }
            if (this.defaultValue != null && this.defaultValue !== "") {
                result += `Default value: ${this.defaultValue}  \n`;
            }
            if (this.enum == null && this.enum.length === 0) {
                result += `Possible values: ${this.enum.join()}  \n`;
            }
            if (this.excludes != null && this.excludes.length !== 0) {
                result += `Can not be specified with: ${this.excludes.join()}  \n`;
            }
            if (this.maxValue != null && this.maxValue !== Infinity) {
                result += `Maximum: ${this.maxValue}  \n`;
            }
            if (this.minValue != null && this.minValue !== -Infinity) {
                result += `Minimum: ${this.minValue}  \n`;
            }
            if (this.section != null && this.section.length !== 0) {
                result += `Allowed in section: ${this.section}  \n`;
            }
            let widgets = "all";
            if (typeof this.widget !== "string" && this.widget.length > 0) {
                widgets = this.widget.join(", ");
            }
            else if (this.widget.length > 0) {
                widgets = this.widget;
            }
            result += `Allowed in widgets: ${widgets}  \n`;
            return result;
        }
        getOverrideTest(scopeSrc) {
            let scopeKeys = ["widget", "section"];
            let scopeSrcExtracted = /^\[(.*)\]$/.exec(scopeSrc);
            if (scopeSrcExtracted == null) {
                throw new Error("Wrong override scope format");
            }
            let source = `return !!(${scopeSrcExtracted[1]});`;
            let compiledScope = new Function(scopeKeys.join(), source);
            return (scope) => {
                try {
                    let values = scopeKeys.map((key) => scope[key]);
                    return compiledScope.apply(void 0, values);
                }
                catch (error) {
                    console.error(`In '${scopeSrc}' :: ${error}`);
                }
            };
        }
    }
    /**
     * Lowercases the string and deletes non-alphabetic characters
     * @param str string to be cleared
     * @returns cleared string
     */
    DefaultSetting.clearSetting = (str) => str.toLowerCase().replace(/[^a-z]/g, "");
    /**
     * Lowercases the value of setting
     * @param str string to be cleared
     * @returns cleared string
     */
    DefaultSetting.clearValue = (str) => str.toLowerCase();
    exports.DefaultSetting = DefaultSetting;
});
/// <amd-module name="Resources"/>
define("Resources", ["require", "exports", "browser-or-node", "Setting"], function (require, exports, browser_or_node_1, setting_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Reads dictionary from "dictionary.json" file
     * @returns array of settings from the file
     */
    function readSettings() {
        let dictionary;
        if (browser_or_node_1.isNode) {
            const path = require("path");
            const fs = require("fs");
            const dictionaryFilePath = path.join(__dirname, "..", "dictionary.json");
            const jsonContent = fs.readFileSync(dictionaryFilePath, "UTF-8");
            dictionary = JSON.parse(jsonContent);
        }
        else {
            const jsonContent = require("../dictionary.json");
            dictionary = jsonContent;
        }
        return dictionary.settings;
    }
    /**
     * Reads descriptions from "descriptions.md" file
     * @returns map of settings names and descriptions
     */
    function readDescriptions() {
        let content = "";
        if (browser_or_node_1.isNode) {
            const path = require("path");
            const fs = require("fs");
            const descriptionsPath = path.join(__dirname, "..", "descriptions.md");
            content = fs.readFileSync(descriptionsPath, "UTF-8");
        }
        else {
            content = require("../descriptions.md").default;
        }
        const map = new Map();
        // ## settingname\n\nsetting description[url](hello#html)\n
        const regExp = /\#\# ([a-z]+?)  \n  \n([^\s#][\S\s]+?)  (?=\n  (?:\n(?=\#)|$))/g;
        let match = regExp.exec(content);
        while (match !== null) {
            const [, name, description] = match;
            map.set(name, description);
            match = regExp.exec(content);
        }
        return map;
    }
    /**
     * Tests if the provided setting complete or not
     * @param setting the setting to test
     * @returns true, if setting is complete, false otherwise
     */
    function isCompleteSetting(setting) {
        return setting !== undefined &&
            setting.displayName !== undefined &&
            setting.type !== undefined &&
            setting.example !== undefined;
    }
    /**
     * @returns map of settings, key is the setting name, value is instance of Setting
     */
    function createSettingsMap() {
        const descriptions = readDescriptions();
        const settings = readSettings();
        const map = new Map();
        for (const setting of settings) {
            if (isCompleteSetting(setting)) {
                const name = setting_3.Setting.clearSetting(setting.displayName);
                Object.assign(setting, { name, description: descriptions.get(name) });
                const completeSetting = new setting_3.Setting(setting);
                map.set(completeSetting.name, completeSetting);
            }
        }
        return map;
    }
    exports.settingsMap = createSettingsMap();
    /**
     * Map of required settings for each section and their "aliases".
     * For instance, `series` requires `entity`, but `entities` is also allowed.
     * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
     */
    exports.requiredSectionSettingsMap = new Map([
        ["configuration", {
                sections: [
                    ["group"],
                ],
            }],
        ["series", {
                settings: [
                    [
                        exports.settingsMap.get("entity"), exports.settingsMap.get("value"),
                        exports.settingsMap.get("entities"), exports.settingsMap.get("entitygroup"),
                        exports.settingsMap.get("entityexpression"),
                    ],
                    [
                        exports.settingsMap.get("metric"), exports.settingsMap.get("value"),
                        exports.settingsMap.get("table"), exports.settingsMap.get("attribute"),
                    ],
                ],
            }],
        ["group", {
                sections: [
                    ["widget"],
                ],
            }],
        ["widget", {
                sections: [
                    ["series"],
                ],
                settings: [
                    [exports.settingsMap.get("type")],
                ],
            }],
        ["dropdown", {
                settings: [
                    [exports.settingsMap.get("onchange"), exports.settingsMap.get("changefield")],
                ],
            }],
        ["node", {
                settings: [
                    [exports.settingsMap.get("id")],
                ],
            }],
    ]);
    exports.widgetRequirementsByType = new Map([
        ["console", {
                sections: [],
            }],
        ["page", {
                sections: [],
            }],
        ["property", {
                sections: [
                    ["property"],
                ],
            }],
        ["graph", {
                sections: [
                    ["series", "node", "link"]
                ],
            }],
    ]);
    /**
     * Key is section name, value is array of parent sections for the key section
     */
    exports.parentSections = new Map([
        ["widget", ["group", "configuration"]],
        ["series", ["widget", "link"]],
        ["tag", ["series"]],
        ["tags", ["series"]],
        ["column", ["widget"]],
        ["node", ["widget"]],
        ["link", ["widget"]],
        ["option", ["dropdown"]]
    ]);
    /**
     * @returns true if the current section is nested in the previous section
     */
    function isNestedToPrevious(currentName, previousName) {
        if (currentName === undefined || previousName === undefined) {
            return false;
        }
        return getParents(currentName).includes(previousName);
    }
    exports.isNestedToPrevious = isNestedToPrevious;
    /**
     * @returns array of parent sections for the section
     */
    function getParents(section) {
        let parents = [];
        const found = exports.parentSections.get(section);
        if (found !== undefined) {
            for (const father of found) {
                // JS recursion is not tail-optimized, replace if possible
                parents = parents.concat(father, getParents(father));
            }
        }
        return parents;
    }
    exports.getParents = getParents;
    exports.sectionDepthMap = {
        "configuration": 0,
        "group": 1,
        "widget": 2,
        "column": 3,
        "dropdown": 3,
        "keys": 3,
        "link": 3,
        "node": 3,
        "other": 3,
        "placeholders": 3,
        "property": 3,
        "series": 3,
        "threshold": 3,
        "option": 4,
        "properties": 4,
        "tag": 4,
        "tags": 4,
    };
    /**
     * Contains names of sections which can appear at depth `1..max_depth`, where
     * `max_depth` is a value from `sectionDepthMap`
     */
    exports.inheritableSections = new Set([
        "keys", "tags"
    ]);
});
define("CompletionProvider", ["require", "exports", "vscode-languageserver-types", "Resources", "Setting", "Util"], function (require, exports, vscode_languageserver_types_3, resources_2, setting_4, util_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.snippets = require("../../snippets/snippets.json");
    /**
     * Provides dynamic completion items.
     */
    class CompletionProvider {
        constructor(textDocument, position) {
            const text = textDocument.getText().substr(0, textDocument.offsetAt(position));
            this.text = util_2.deleteScripts(util_2.deleteComments(text));
            let textList = this.text.split("\n");
            this.currentLine = textList[textList.length - 1];
        }
        /**
         * Creates completion items
         */
        getCompletionItems() {
            let match = /^\s*(\S+)\s*=\s*/.exec(this.currentLine);
            if (match) {
                // completion requested at assign stage, i. e. type = <Ctrl + space>
                return this.completeSettingValue(match[1]);
            }
            else {
                // completion requested at start of line (supposed that line is empty)
                return this.completeSnippets().concat(this.completeIf(), this.completeFor(), this.completeSettingName());
            }
        }
        /**
         * Creates a completion item containing `for` loop.
         * `in` statement is generated based on previously declared lists and vars if any.
         * Variable name is generated based on `in` statement.
         * @returns completion item
         */
        completeFor() {
            const regexp = /^[ \t]*(?:list|var)[ \t]+(\S+)[ \t]*=/mg;
            let match = regexp.exec(this.text);
            let lastMatch;
            while (match) {
                lastMatch = match;
                match = regexp.exec(this.text);
            }
            let collection = "collection";
            let item = "item";
            if (lastMatch) {
                collection = lastMatch[1];
                if (collection.endsWith("s")) {
                    item = collection.substr(0, collection.lastIndexOf("s"));
                }
            }
            const completion = vscode_languageserver_types_3.CompletionItem.create("for");
            completion.insertText = `
for \${1:${item}} in \${2:${collection}}
  \${3:entity = @{\${1:${item}}}}
  \${0}
endfor`;
            completion.detail = "For loop";
            completion.kind = vscode_languageserver_types_3.CompletionItemKind.Keyword;
            completion.insertTextFormat = vscode_languageserver_types_3.InsertTextFormat.Snippet;
            return completion;
        }
        /**
         * Creates an array of completion items containing `if` statement.
         * Conditions are generated based on previously declared `for` loops.
         * @returns array containing variants of `if` statement
         */
        completeIf() {
            const regexp = /^[ \t]*for[ \t]+(\w+)[ \t]+in/img;
            const endFor = /^[ \t]*endfor/img;
            let match = regexp.exec(this.text);
            let lastMatch;
            while (match) {
                const end = endFor.exec(this.text);
                if (!end || end.index < match.index) {
                    lastMatch = match;
                }
                match = regexp.exec(this.text);
            }
            let item = "item";
            if (lastMatch) {
                item = lastMatch[1];
            }
            const ifString = vscode_languageserver_types_3.CompletionItem.create("if string");
            ifString.detail = "if item equals text";
            ifString.insertText = `
if @{\${1:${item}}} \${2:==} \${3:"item1"}
  \${4:entity} = \${5:"item2"}
else
  \${4:entity} = \${6:"item3"}
endif
\${0}`;
            const ifNumber = vscode_languageserver_types_3.CompletionItem.create("if number");
            ifNumber.insertText = `
if @{\${1:${item}}} \${2:==} \${3:5}
  \${4:entity} = \${5:"item1"}
else
  \${4:entity} = \${6:"item2"}
endif
\${0}`;
            ifNumber.detail = "if item equals number";
            const ifElseIf = vscode_languageserver_types_3.CompletionItem.create("if else if");
            ifElseIf.detail = "if item equals number else if";
            ifElseIf.insertText = `
if @{\${1:${item}}} \${2:==} \${3:5}
  \${4:entity} = \${5:"item1"}
elseif @{\${1:${item}}} \${6:==} \${7:6}
  \${4:entity} = \${8:"item2"}
else
  \${4:entity} = \${9:"item3"}
endif
\${0}`;
            return [ifString, ifNumber, ifElseIf].map((completion) => {
                completion.insertTextFormat = vscode_languageserver_types_3.InsertTextFormat.Snippet;
                completion.kind = vscode_languageserver_types_3.CompletionItemKind.Snippet;
                return completion;
            });
        }
        /**
         * Creates an array of completion items containing setting names.
         * @returns array containing snippets
         */
        completeSettingName() {
            const items = [];
            for (let [, value] of resources_2.settingsMap) {
                items.push(this.fillCompletionItem({
                    detail: `${value.description ? value.description + "\n" : ""}Example: ${value.example}`,
                    insertText: `${value.displayName} = `,
                    kind: vscode_languageserver_types_3.CompletionItemKind.Field,
                    name: value.displayName
                }));
            }
            return items;
        }
        /**
         * Creates an array of completion items containing possible values for settings.
         * @param settingName name of the setting, for example "colors"
         * @returns array containing completions
         */
        completeSettingValue(settingName) {
            const setting = util_2.getSetting(settingName);
            if (!setting) {
                return [];
            }
            switch (setting.type) {
                case "string": {
                    return this.completeStringSettingValue(setting);
                }
                case "number":
                case "integer":
                    if (setting.example) {
                        return [this.fillCompletionItem({ insertText: setting.example.toString() })];
                    }
                    break;
                case "boolean": {
                    return this.getItemsArray(["true", "false"]);
                }
                case "enum": {
                    return this.getItemsArray(setting.enum.map(el => el.replace(/percentile\\.+/, "percentile(n)")));
                }
                case "interval": {
                    return this.getItemsArray(setting_4.intervalUnits, ...setting.enum);
                }
                case "date": {
                    return this.getItemsArray(setting_4.calendarKeywords, new Date().toISOString());
                }
                default: {
                    return [];
                }
            }
            return [];
        }
        /**
         * Creates an array of completion items containing snippets.
         * @returns array containing snippets
         */
        completeSnippets() {
            const items = Object.keys(exports.snippets).map((key) => {
                const insertText = (typeof exports.snippets[key].body === "string") ? exports.snippets[key].body : exports.snippets[key].body.join("\n");
                return this.fillCompletionItem({
                    insertText, detail: exports.snippets[key].description,
                    name: key, insertTextFormat: vscode_languageserver_types_3.InsertTextFormat.Snippet, kind: vscode_languageserver_types_3.CompletionItemKind.Keyword
                });
            });
            return items;
        }
        /**
         * Creates an array of completion items containing possible values for settings with type = "string".
         * @param setting the setting
         * @returns array containing completions
         */
        completeStringSettingValue(setting) {
            let valueItems = [];
            let scriptItems = [];
            if (setting.possibleValues) {
                valueItems = setting.possibleValues.map(v => this.fillCompletionItem({ insertText: v.value, detail: v.detail }));
            }
            if (setting.script) {
                setting.script.fields.forEach((field) => {
                    if (field.type === "function") {
                        let itemFields = { insertText: "", kind: vscode_languageserver_types_3.CompletionItemKind.Function };
                        if (field.args) {
                            let requiredArgs = field.args.filter(a => a.required);
                            let optionalArgs = field.args.filter(a => !a.required);
                            let requiredArgsString = `${requiredArgs.map(field => field.name).join(", ")}`;
                            itemFields.insertText = `${field.name}${requiredArgsString !== "" ?
                                "(" + requiredArgsString + ")" : ""}`;
                            scriptItems.push(this.fillCompletionItem(itemFields));
                            let args = "";
                            for (let arg of optionalArgs) {
                                args = `${args !== "" ? args + ", " : ""}${arg.name}`;
                                itemFields.insertText = `${field.name}(${requiredArgsString !== "" ?
                                    requiredArgsString + ", " : ""}${args})`;
                                scriptItems.push(this.fillCompletionItem(itemFields));
                            }
                        }
                        else {
                            itemFields.insertText = field.name;
                            scriptItems.push(this.fillCompletionItem(itemFields));
                        }
                    }
                    else {
                        scriptItems.push(this.fillCompletionItem({
                            insertText: field.name,
                            detail: `Type: ${field.type}`
                        }));
                    }
                });
            }
            if (!setting.possibleValues && setting.example !== "") {
                valueItems = [this.fillCompletionItem({
                        insertText: setting.example.toString(),
                        kind: vscode_languageserver_types_3.CompletionItemKind.Field
                    })];
            }
            return valueItems.concat(scriptItems);
        }
        /**
         * Set fields for CompletionItem
         * @param insertText text to be inserted with completion request
         * @returns completion
         */
        fillCompletionItem(itemFields) {
            let item = vscode_languageserver_types_3.CompletionItem.create(itemFields.name || itemFields.insertText);
            item.insertTextFormat = itemFields.insertTextFormat || vscode_languageserver_types_3.InsertTextFormat.PlainText;
            item.kind = itemFields.kind || vscode_languageserver_types_3.CompletionItemKind.Value;
            item.insertText = itemFields.insertText;
            item.detail = itemFields.detail || itemFields.insertText;
            item.sortText = item.kind.toString();
            return item;
        }
        /**
         * Сonverts the source array to array of completions
         * @param processedArray the source array
         * @param additionalStrings the strings to be processed and added to completions
         * @returns completions
         */
        getItemsArray(processedArray, ...additionalStrings) {
            let items = processedArray.map(el => this.fillCompletionItem({ insertText: el }));
            for (let s of additionalStrings) {
                items.push(this.fillCompletionItem({ insertText: s }));
            }
            return items;
        }
    }
    exports.CompletionProvider = CompletionProvider;
});
define("Config", ["require", "exports", "Util"], function (require, exports, util_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Stores config lines as array, removes comments.
     */
    class Config {
        constructor(text) {
            this.currentLineNumber = -1;
            this.lines = util_3.deleteComments(text)
                .toLowerCase()
                .split("\n");
        }
        getCurrentLine() {
            return this.currentLine;
        }
        /**
         * Returns lowercased config line with specified index.
         *
         * @param line - Index of line to be returned
         * @returns Lowercased line of config with index equal to `line`
         */
        getLine(line) {
            return (line < this.lines.length && line >= 0) ? this.lines[line] : null;
        }
        *[Symbol.iterator]() {
            for (let line of this.lines) {
                this.currentLine = line;
                this.currentLineNumber++;
                yield line;
            }
        }
    }
    exports.Config = Config;
});
define("CheckPriority", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("TextRange", ["require", "exports", "Util"], function (require, exports, util_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Contains the text and the position of the text
     */
    class TextRange {
        constructor(text, range, canBeUnclosed = false) {
            /**
             * Priority of the text, used in jsDomCaller: settings with higher priority are placed earlier in test js "file"
             */
            this.priority = 1 /* Low */;
            this.range = range;
            this.text = text;
            this.canBeUnclosed = canBeUnclosed;
        }
        /**
         * Checks is current keyword closeable or not (can be closed like var-endvar)
         * @param line the line containing the keyword
         * @returns true if the keyword closeable
         */
        static isCloseAble(line) {
            return /^[\s\t]*(?:for|if|list|sql|var|script[\s\t]*$|csv|else|elseif)\b/.test(line);
        }
        /**
         * Checks does the keyword close a section or not
         * @param line the line containing the keyword
         * @returns true if the keyword closes a section
         */
        static isClosing(line) {
            return /^[\s\t]*(?:end(?:for|if|list|var|script|sql|csv)|elseif|else)\b/.test(line);
        }
        /**
         * Parses a keyword from the line and creates a TextRange.
         * @param line the line containing the keyword
         * @param i the index of the line
         * @param canBeUnclosed whether keyword can exist in both closed and unclosed variant or not
         */
        static parse(line, i, canBeUnclosed) {
            const match = TextRange.KEYWORD_REGEXP.exec(line);
            if (match === null) {
                return undefined;
            }
            const [, indent, keyword] = match;
            return new TextRange(keyword, util_4.createRange(indent.length, keyword.length, i), canBeUnclosed);
        }
        /**
         * priority property setter
         */
        set textPriority(value) {
            this.priority = value;
        }
    }
    /**
     * Matches a keyword
     */
    TextRange.KEYWORD_REGEXP = 
    // tslint:disable-next-line: max-line-length
    /^([ \t]*)(import|endvar|endcsv|endfor|elseif|endif|endscript|endlist|endsql|script|else|if|list|sql|for|csv|var)\b/i;
    exports.TextRange = TextRange;
});
define("relatedSettingsRules/utils/condition", ["require", "exports", "Util"], function (require, exports, util_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Settings, that are frequently used in conditions checks,
     * see requiredSettings.ts and uselessSettings.ts.
     */
    const frequentlyUsed = ["mode", "type"];
    /**
     * Returns value of setting with specified displayName:
     *  a) if setting is frequently used, tries to get it from section's scope;
     *  b) otherwise searches setting in tree
     *  c) if there is no setting in tree, returns default value.
     *
     * @param settingName - Name of setting, which value is requisted
     * @param section - Start section, from which setting must be searched
     * @returns Value of Setting with name `settingName`.
     */
    function getValueOfCheckedSetting(settingName, section) {
        let value;
        if (frequentlyUsed.includes(settingName)) {
            value = section.getScopeValue(settingName);
        }
        else {
            let setting = section.getSettingFromTree(settingName);
            if (setting === undefined) {
                /**
                 * Setting is not declared, thus loooking for default value.
                 */
                setting = util_5.getSetting(settingName);
                if (setting !== undefined) {
                    value = setting.defaultValue;
                }
            }
            else {
                value = setting.value;
            }
        }
        return value;
    }
    /**
     * Returns function, which validates value of specified setting.
     *
     * @param settingName - Name of the setting
     * @param possibleValues  - Values that can be assigned to the setting
     * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
     */
    function requiredCondition(settingName, possibleValues) {
        return (section) => {
            const value = getValueOfCheckedSetting(settingName, section);
            return value ? new RegExp(possibleValues.join("|")).test(value.toString()) : true;
        };
    }
    exports.requiredCondition = requiredCondition;
    /**
     * Returns function, which validates value of specified setting and generates string
     * with allowed values if check is not passed.
     *
     * @param settingName - Name of the setting
     * @param possibleValues - Values that can be assigned to the setting
     * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
     *          and generates info string if check is not passed
     */
    function isNotUselessIf(settingName, possibleValues) {
        return (section) => {
            const value = getValueOfCheckedSetting(settingName, section);
            const valueIsOk = value ? new RegExp(possibleValues.join("|")).test(value.toString()) : true;
            if (!valueIsOk) {
                if (possibleValues.length > 1) {
                    return `${settingName} is one of ${possibleValues.join(", ")}`;
                }
                else {
                    return `${settingName} is ${possibleValues[0]}`;
                }
            }
            return null;
        };
    }
    exports.isNotUselessIf = isNotUselessIf;
});
define("configTree/section", ["require", "exports", "Setting"], function (require, exports, setting_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * ConfigTree node.
     */
    class Section {
        /**
         * @param range - The text (name of section) and the position of the text
         * @param settings - Section settings
         */
        constructor(range, settings) {
            this.children = [];
            this.scope = {};
            this.range = range;
            this.name = range.text;
            this.settings = settings;
        }
        applyScope() {
            if (this.parent !== undefined) {
                /**
                 * We are not at [configuration].
                 */
                this.scope = Object.create(this.parent.scope);
            }
            for (const setting of this.settings) {
                if (setting.name === "type") {
                    this.scope.widgetType = setting.value;
                }
                else if (setting.name === "mode") {
                    this.scope.mode = setting.value;
                }
            }
        }
        /**
         * Returns setting from this section by it's displayName.
         *
         * @param name - Setting.displayName
         * @returns Setting with displayname equal to `settingName`
         */
        getSetting(name) {
            const cleared = setting_5.Setting.clearSetting(name);
            return this.settings.find(s => s.name === cleared);
        }
        /**
         * Searches setting in the tree by it's displayName,
         * starting from the current section and ending root, returns the closest one.
         *
         * @param settingName - Setting.displayName
         * @returns Setting with displayname equal to `settingName`
         */
        getSettingFromTree(settingName) {
            let currentSection = this;
            while (currentSection) {
                const value = currentSection.getSetting(settingName);
                if (value !== void 0) {
                    return value;
                }
                currentSection = currentSection.parent;
            }
            return undefined;
        }
        getScopeValue(settingName) {
            return settingName === "type" ? this.scope.widgetType : this.scope.mode;
        }
        /**
         * Returns true if section passes all of conditions, otherwise returns false.
         *
         * @param conditions - Array of conditions, for which section must be checked
         * @returns Result of `conditions` checks.
         */
        matchesConditions(conditions) {
            const section = this;
            if (conditions === undefined) {
                return true;
            }
            for (const condition of conditions) {
                const currCondition = condition(section);
                if (!currCondition) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.Section = Section;
});
define("configTree/configTree", ["require", "exports", "Resources", "configTree/section"], function (require, exports, resources_3, section_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Stores sections with corresponding settings in tree order.
     */
    class ConfigTree {
        get getRoot() {
            return this.root;
        }
        /**
         * Creates Section object based on `range` and `settings`, applies scope to it and adds to tree.
         * Doesn't alert if the section is out of order, this check is performed by SectionStack.
         *
         * @param range - The text (name of section) and the position of the text
         * @param settings - Section settings
         */
        addSection(range, settings) {
            const section = new section_1.Section(range, settings);
            const depth = resources_3.sectionDepthMap[range.text];
            if (depth > 0 && !this.root) {
                return;
            }
            switch (depth) {
                case 0: { // [configuration]
                    this.root = section;
                    this.lastAddedParent = section;
                    break;
                }
                case 1: { // [group]
                    section.parent = this.root;
                    this.lastAddedParent = section;
                    break;
                }
                case 2: { // [widget]
                    const group = this.root.children[this.root.children.length - 1];
                    if (!group) {
                        return;
                    }
                    section.parent = group;
                    this.lastAddedParent = section;
                    break;
                }
                case 3: { // [series], [dropdown], [column], ...
                    if (this.lastAddedParent && this.lastAddedParent.name === "column" && range.text === "series") {
                        section.parent = this.lastAddedParent;
                    }
                    else {
                        const group = this.root.children[this.root.children.length - 1];
                        if (!group) {
                            return;
                        }
                        const widget = group.children[group.children.length - 1];
                        if (!widget) {
                            return;
                        }
                        section.parent = widget;
                        this.lastAddedParent = section;
                    }
                    break;
                }
                case 4: { // [option], [properties], [tags]
                    if (resources_3.isNestedToPrevious(range.text, this.previous.name)) {
                        section.parent = this.previous;
                    }
                    else {
                        section.parent = this.lastAddedParent;
                    }
                    if (!section.parent) {
                        return;
                    }
                    break;
                }
            }
            if (section.parent) {
                // We are not in [configuration]
                section.parent.children.push(section);
            }
            this.previous = section;
            section.applyScope();
        }
    }
    exports.ConfigTree = ConfigTree;
});
define("relatedSettingsRules/utils/interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("relatedSettingsRules/presenceValidation/noUselessSettings/forSeries", ["require", "exports", "relatedSettingsRules/utils/condition"], function (require, exports, condition_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
     */
    const checks = new Map([
        [
            "forecast-arima-auto-regression-interval", [
                /**
                 * If "type!=chart" OR "forecast-arima-auto=true",
                 * setting "forecast-arima-auto-regression-interval" is useless.
                 */
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-arima-auto", ["false"])
            ]
        ],
        [
            "forecast-arima-d", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-arima-auto", ["false"])
            ]
        ],
        [
            "forecast-arima-p", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-arima-auto", ["false"])
            ]
        ],
        [
            "forecast-hw-alpha", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-hw-auto", ["false"])
            ]
        ],
        [
            "forecast-hw-beta", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-hw-auto", ["false"])
            ]
        ],
        [
            "forecast-hw-gamma", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-hw-auto", ["false"])
            ]
        ]
    ]);
    exports.default = checks;
});
define("relatedSettingsRules/presenceValidation/noUselessSettings/forWidget", ["require", "exports", "relatedSettingsRules/utils/condition"], function (require, exports, condition_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
     */
    const checks = new Map([
        [
            "negative-style",
            /**
             * If "type!=chart" OR "mode" is NOT "column-stack" or "column",
             * settings "negative-style" and "current-period-style" are useless.
             */
            [
                condition_2.isNotUselessIf("type", ["chart"]),
                condition_2.isNotUselessIf("mode", ["column-stack", "column"])
            ]
        ],
        [
            "current-period-style", [
                condition_2.isNotUselessIf("type", ["chart"]),
                condition_2.isNotUselessIf("mode", ["column-stack", "column"])
            ]
        ],
        [
            "moving-average", [
                condition_2.isNotUselessIf("type", ["chart"]),
                condition_2.isNotUselessIf("server-aggregate", ["false"])
            ]
        ],
        [
            "ticks", [
                condition_2.isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
                condition_2.isNotUselessIf("mode", ["half", "default"])
            ]
        ],
        [
            "color-range", [
                condition_2.isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
                condition_2.isNotUselessIf("mode", ["half", "default"])
            ]
        ],
        [
            "gradient-count", [
                condition_2.isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
                condition_2.isNotUselessIf("mode", ["half", "default"])
            ]
        ]
    ]);
    exports.default = checks;
});
define("relatedSettingsRules/presenceValidation/noUselessSettings/index", ["require", "exports", "vscode-languageserver-types", "MessageUtil", "Util", "relatedSettingsRules/presenceValidation/noUselessSettings/forSeries", "relatedSettingsRules/presenceValidation/noUselessSettings/forWidget"], function (require, exports, vscode_languageserver_types_4, messageUtil_2, util_6, forSeries_1, forWidget_1) {
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
                    diagnostics.push(util_6.createDiagnostic(dependentSetting.textRange, messageUtil_2.uselessScope(dependentSetting.displayName, `${msg.join(", ")}`), vscode_languageserver_types_4.DiagnosticSeverity.Warning));
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
define("relatedSettingsRules/presenceValidation/requiredSettings", ["require", "exports", "MessageUtil", "Util", "relatedSettingsRules/utils/condition"], function (require, exports, messageUtil_3, util_7, condition_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * If key (dependent) is declared in the section and the section matches all of conditions, then:
     *   a) setting, specified in `requiredSetting` is required for this section;
     *      or
     *   b) required at least one setting from `requiredSetting` array.
     * If `conditions` are null, suppose the section matches conditions.
     */
    const checks = new Map([
        [
            "colors", {
                /**
                 * If "colors" is specified:
                 *  1) check that:
                 *      1) "type" is "calendar", "treemap " or "gauge";
                 *      2) "mode" is "half" or "default";
                 *  2) require "thresholds" (try to search in tree and create Diagnostic if neccessary).
                 */
                conditions: [
                    condition_3.requiredCondition("type", ["calendar", "treemap", "gauge"]),
                    condition_3.requiredCondition("mode", ["half", "default"])
                ],
                requiredSetting: "thresholds"
            }
        ],
        [
            "forecast-style", {
                conditions: [
                    condition_3.requiredCondition("type", ["chart"]),
                    condition_3.requiredCondition("mode", ["column", "column-stack"])
                ],
                requiredSetting: "data-type"
            }
        ],
        [
            "forecast-horizon-start-time", {
                /**
                 * If "forecast-horizon-start-time" is specified:
                 *  1) check that "type" is "chart";
                 *  2) require any of "forecast-horizon-end-time", "forecast-horizon-interval", "forecast-horizon-length".
                 */
                conditions: [
                    condition_3.requiredCondition("type", ["chart"])
                ],
                requiredSetting: ["forecast-horizon-end-time", "forecast-horizon-interval", "forecast-horizon-length"]
            }
        ],
        [
            "table", {
                /**
                 * If "table" is specified, require "attribute".
                 */
                requiredSetting: "attribute"
            }
        ],
        [
            "attribute", {
                requiredSetting: "table"
            }
        ],
        [
            "column-alert-style", {
                conditions: [
                    condition_3.requiredCondition("type", ["bar"])
                ],
                requiredSetting: "column-alert-expression"
            }
        ],
        [
            "alert-style", {
                requiredSetting: "alert-expression"
            }
        ],
        [
            "link-alert-style", {
                conditions: [
                    condition_3.requiredCondition("type", ["graph"])
                ],
                requiredSetting: "alert-expression"
            }
        ],
        [
            "node-alert-style", {
                conditions: [
                    condition_3.requiredCondition("type", ["graph"])
                ],
                requiredSetting: "alert-expression"
            }
        ],
        [
            "icon-alert-style", {
                conditions: [
                    condition_3.requiredCondition("type", ["pie", "text"])
                ],
                requiredSetting: "icon-alert-expression"
            }
        ],
        [
            "icon-alert-expression", {
                conditions: [
                    condition_3.requiredCondition("type", ["pie"])
                ],
                requiredSetting: "icon"
            }
        ],
        [
            "icon-color", {
                conditions: [
                    condition_3.requiredCondition("type", ["text"])
                ],
                requiredSetting: "icon"
            }
        ],
        [
            "icon-position", {
                conditions: [
                    condition_3.requiredCondition("type", ["text"])
                ],
                requiredSetting: "icon"
            }
        ],
        [
            "icon-size", {
                conditions: [
                    condition_3.requiredCondition("type", ["text"])
                ],
                requiredSetting: "icon"
            }
        ],
        [
            "caption-style", {
                conditions: [
                    condition_3.requiredCondition("type", ["pie", "gauge"])
                ],
                requiredSetting: "caption"
            }
        ]
    ]);
    const rule = {
        name: "Checks presence of required setting if dependent is specified",
        check(section) {
            const diagnostics = [];
            checks.forEach((requirement, dependent) => {
                if (!section.matchesConditions(requirement.conditions)) {
                    return;
                }
                const dependentSetting = section.getSettingFromTree(dependent);
                if (dependentSetting === undefined) {
                    return;
                }
                const reqNames = requirement.requiredSetting;
                let required;
                let msg;
                if (Array.isArray(reqNames)) {
                    for (const displayName of reqNames) {
                        required = section.getSettingFromTree(displayName);
                        if (required) {
                            break;
                        }
                    }
                    msg = messageUtil_3.noRequiredSettings(dependent, reqNames);
                }
                else {
                    required = section.getSettingFromTree(reqNames);
                    msg = messageUtil_3.noRequiredSetting(dependent, reqNames);
                }
                if (required === undefined) {
                    diagnostics.push(util_7.createDiagnostic(section.range.range, msg));
                }
            });
            return diagnostics;
        }
    };
    exports.default = rule;
});
define("relatedSettingsRules/valueValidation/colorsThresholds", ["require", "exports", "MessageUtil", "Util", "relatedSettingsRules/utils/condition"], function (require, exports, messageUtil_4, util_8, condition_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const rule = {
        name: "Checks colors is less than thresholds by 1",
        check(section) {
            let colorsValues;
            let thresholdsValues;
            if (!section.matchesConditions([
                condition_4.requiredCondition("type", ["calendar", "treemap", "gauge"]),
                condition_4.requiredCondition("mode", ["half", "default"])
            ])) {
                return;
            }
            const colorsSetting = section.getSettingFromTree("colors");
            if (colorsSetting === undefined) {
                return;
            }
            const thresholdsSetting = section.getSettingFromTree("thresholds");
            if (thresholdsSetting === undefined) {
                return util_8.createDiagnostic(section.range.range, `thresholds is required if colors is specified`);
            }
            if (colorsSetting.values.length > 0) {
                colorsSetting.values.push(colorsSetting.value);
                colorsValues = colorsSetting.values;
            }
            else {
                /**
                 * Converts 1) -> 2):
                 * 1) colors = rgb(247,251,255), rgb(222,235,247), rgb(198,219,239)
                 * 2) colors = rgb, rgb, rgb
                 */
                colorsValues = colorsSetting.value.replace(/(\s*\d{3}\s*,?)/g, "");
                colorsValues = colorsValues.split(",").filter(s => s.trim() !== "");
            }
            if (thresholdsSetting.values.length > 0) {
                thresholdsSetting.values.push(thresholdsSetting.value);
                thresholdsValues = thresholdsSetting.values;
            }
            else {
                thresholdsValues = thresholdsSetting.value.split(",").filter(s => s.trim() !== "");
            }
            const expected = thresholdsValues.length - 1;
            if (colorsValues.length !== expected) {
                return util_8.createDiagnostic(colorsSetting.textRange, messageUtil_4.incorrectColors(`${colorsValues.length}`, `${expected}`));
            }
        }
    };
    exports.default = rule;
});
define("relatedSettingsRules/valueValidation/forecastAutoCountAndEigentripleLimit", ["require", "exports", "Util"], function (require, exports, util_9) {
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
                forecastLimit.value : util_9.getSetting("forecast-ssa-decompose-eigentriple-limit").defaultValue;
            if (eigentripleLimitValue <= groupAutoCount.value) {
                return util_9.createDiagnostic(groupAutoCount.textRange, `forecast-ssa-group-auto-count ` +
                    `must be less than forecast-ssa-decompose-eigentriple-limit (default 0)`);
            }
        }
    };
    exports.default = rule;
});
define("relatedSettingsRules/valueValidation/forecastEndTime", ["require", "exports", "vscode-languageserver-types", "Util"], function (require, exports, vscode_languageserver_types_5, util_10) {
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
                return util_10.createDiagnostic(end.textRange, `${forecast.displayName} must be greater than ${end.displayName}`, vscode_languageserver_types_5.DiagnosticSeverity.Error);
            }
        }
    };
    exports.default = rule;
});
define("relatedSettingsRules/valueValidation/startEndTime", ["require", "exports", "vscode-languageserver-types", "Util"], function (require, exports, vscode_languageserver_types_6, util_11) {
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
                return util_11.createDiagnostic(end.textRange, `${end.displayName} must be greater than ${start.displayName}`, vscode_languageserver_types_6.DiagnosticSeverity.Error);
            }
        }
    };
    exports.default = rule;
});
define("relatedSettingsRules/index", ["require", "exports", "relatedSettingsRules/presenceValidation/noUselessSettings/index", "relatedSettingsRules/presenceValidation/requiredSettings", "relatedSettingsRules/valueValidation/colorsThresholds", "relatedSettingsRules/valueValidation/forecastAutoCountAndEigentripleLimit", "relatedSettingsRules/valueValidation/forecastEndTime", "relatedSettingsRules/valueValidation/startEndTime"], function (require, exports, index_1, requiredSettings_1, colorsThresholds_1, forecastAutoCountAndEigentripleLimit_1, forecastEndTime_1, startEndTime_1) {
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
define("configTree/configTreeValidator", ["require", "exports", "relatedSettingsRules/index"], function (require, exports, relatedSettingsRules_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ConfigTreeValidator {
        /**
         * Goes through validationRules and performs checks on corresponding sections.
         *
         * @param сonfigTree - Configuration tree
         * @returns Diagnosics about problems in sections
         */
        static validate(сonfigTree) {
            const walker = new ConfigTreeWalker(сonfigTree);
            const diagnostics = [];
            relatedSettingsRules_1.default.forEach((rulesForSection, sectionName) => {
                const sectionsToCheck = walker.getSectionsByName(sectionName);
                if (sectionsToCheck.length > 0) {
                    sectionsToCheck.forEach(section => {
                        rulesForSection.forEach(rule => {
                            const diag = rule.check(section);
                            if (diag) {
                                if (Array.isArray(diag)) {
                                    diagnostics.push(...diag);
                                }
                                else {
                                    diagnostics.push(diag);
                                }
                            }
                        });
                    });
                }
            });
            return diagnostics;
        }
    }
    exports.ConfigTreeValidator = ConfigTreeValidator;
    // tslint:disable-next-line:max-classes-per-file
    class ConfigTreeWalker {
        constructor(сonfigTree) {
            this.requestedSections = [];
            this.tree = сonfigTree;
        }
        /**
         * Triggers bypass of ConfigTree and returns array with specified sections.
         *
         * @param sectionName - Name of sections to be returned
         * @returns Array of sections with name `sectionName`
         */
        getSectionsByName(sectionName) {
            if (this.tree.getRoot) {
                this.walk(sectionName, this.tree.getRoot);
            }
            return this.requestedSections;
        }
        /**
         * Recursively bypasses the ConfigTree starting from `startsection` and
         * adds every section with name `targetSection` to the `requestedSections` array.
         *
         * @param targetSection - Name of sections to be added to `requestedSections` array
         * @param startSection - Section, from which the walk must begin
         */
        walk(targetSection, startSection) {
            for (let section of startSection.children) {
                if (section.name === targetSection) {
                    this.requestedSections.push(section);
                }
                else {
                    this.walk(targetSection, section);
                }
            }
        }
    }
});
define("KeywordHandler", ["require", "exports", "MessageUtil", "Util"], function (require, exports, messageUtil_5, util_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Regular expressions to match SQL.
     */
    const ONE_LINE_SQL = /^\s*sql\s*=.*$/m;
    const BLOCK_SQL_START_WITHOUT_LF = /(^\s*)sql\s*\S/;
    exports.BLOCK_SQL_START = /sql(?!([\s\S]*=))/;
    exports.BLOCK_SQL_END = /^\s*endsql\s*$/;
    /**
     * Regular expressions to match script.
     */
    const ONE_LINE_SCRIPT = /^\s*script\s*=.*$/m;
    const BLOCK_SCRIPT_START_WITHOUT_LF = /(^\s*)script\s*\S/;
    exports.BLOCK_SCRIPT_START = /script(?!([\s\S]*=))/;
    exports.BLOCK_SCRIPT_END = /^\s*endscript\s*$/;
    class KeywordHandler {
        constructor(keywordsStack) {
            this.diagnostics = [];
            this.keywordsStack = keywordsStack;
        }
        handleSql(line, foundKeyword) {
            if (ONE_LINE_SQL.test(line)) {
                return;
            }
            this.keywordsStack.push(foundKeyword);
            const match = BLOCK_SQL_START_WITHOUT_LF.exec(line);
            if (match !== null) {
                this.diagnostics.push(util_12.createDiagnostic(util_12.createRange(match[1].length, "sql".length, foundKeyword.range.start.line), messageUtil_5.lineFeedRequired("sql")));
            }
        }
        handleScript(line, foundKeyword) {
            if (ONE_LINE_SCRIPT.test(line)) {
                return;
            }
            this.keywordsStack.push(foundKeyword);
            const match = BLOCK_SCRIPT_START_WITHOUT_LF.exec(line);
            if (match !== null) {
                this.diagnostics.push(util_12.createDiagnostic(util_12.createRange(match[1].length, "script".length, foundKeyword.range.start.line), messageUtil_5.lineFeedRequired("script")));
            }
        }
    }
    exports.KeywordHandler = KeywordHandler;
});
define("SectionStackNode", ["require", "exports", "vscode-languageserver-types", "Resources", "Setting", "TextRange", "Util"], function (require, exports, vscode_languageserver_types_7, resources_4, setting_6, textRange_1, util_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SectionStackNode {
        constructor(range) {
            this.range = range;
            this.dependencies = [];
            this.settings = [];
            const deps = resources_4.requiredSectionSettingsMap.get(this.name);
            if (deps && deps.sections) {
                this.setRequiredSections(deps.sections);
            }
        }
        setRequiredSections(sections) {
            this.dependencies.splice(0, this.dependencies.length);
            for (const option of sections) {
                this.dependencies.push({
                    resolvedCount: 0,
                    unresolved: option.slice(),
                });
            }
        }
        insertSetting(setting) {
            this.settings.push(setting);
        }
        getSetting(name) {
            const cleared = setting_6.Setting.clearSetting(name);
            return this.settings.find(s => s.name === cleared);
        }
        /**
         * Remove section from dependency list for every dependency option
         * @param name name of incoming section
         */
        resolveDependency(name) {
            for (const option of this.dependencies) {
                const index = option.unresolved.indexOf(name);
                if (index >= 0) {
                    option.resolvedCount++;
                    option.unresolved.splice(index, 1);
                }
            }
        }
        /**
         * True if dependencies for any dependency option are resolved
         */
        get dependenciesResolved() {
            if (this.dependencies.length === 0) {
                return true;
            }
            return this.dependencies.some((deps) => deps.unresolved.length === 0);
        }
        /**
         * A name of underlying section
         */
        get name() {
            return this.range.text;
        }
        /**
         * A list of unresolved dependencies for section. If several options for
         * dependency list provisioned, return best of them. The best option is
         * an option with max number of resolved dependencies and min length of
         * unresolved.
         */
        get unresolved() {
            if (this.dependencies.length === 0) {
                return [];
            }
            const bestDependencyOption = this.dependencies
                .reduce((best, dep) => {
                if (dep.resolvedCount > best.resolvedCount) {
                    return dep;
                }
                if (dep.unresolved.length < best.unresolved.length) {
                    return dep;
                }
                return best;
            });
            return bestDependencyOption.unresolved;
        }
    }
    /**
     * A null object to prevent multiple errors on missing root section
     */
    const DummySectionStackNode = {
        dependencies: [],
        dependenciesResolved: true,
        name: "",
        range: new textRange_1.TextRange("", vscode_languageserver_types_7.Range.create(vscode_languageserver_types_7.Position.create(0, 0), vscode_languageserver_types_7.Position.create(0, 0))),
        settings: [],
        unresolved: [],
        resolveDependency() { },
        setRequiredSections() { },
        getSetting() { return undefined; },
        insertSetting() { },
        [Symbol.toStringTag]: "DummySectionStackNode",
    };
    // tslint:disable-next-line:max-classes-per-file
    class SectionStack {
        constructor() {
            this.stack = [];
        }
        insertSection(section) {
            const sectionName = section.text;
            let [depth, error] = this.checkAndGetDepth(section);
            if (depth < this.stack.length) {
                if (depth === 0) {
                    // We are attempting to declare [configuration] twice
                    return this.createErrorDiagnostic(section, `Unexpected section [${sectionName}].`);
                }
                // Pop stack, check dependencies of popped resolved
                error = this.checkDependenciesResolved(depth);
                this.stack.splice(depth, this.stack.length - depth);
            }
            for (let i = this.stack.length; i < depth; i++) {
                this.stack.push(DummySectionStackNode);
            }
            for (const entry of this.stack) {
                entry.resolveDependency(sectionName);
            }
            this.stack.push(new SectionStackNode(section));
            return error;
        }
        getLastSection() {
            return this.stack[this.stack.length - 1];
        }
        finalize() {
            let err = this.checkDependenciesResolved(0);
            this.stack = [];
            return err;
        }
        requireSections(targetSection, ...sections) {
            let target = this.stack.find(s => s.name === targetSection);
            if (target) {
                for (let dep of target.dependencies) {
                    for (let section of sections) {
                        if (!dep.unresolved.includes(section)) {
                            dep.unresolved.push(section);
                        }
                    }
                }
                if (target.dependencies.length === 0) {
                    target.dependencies.push({
                        resolvedCount: 0,
                        unresolved: sections,
                    });
                }
            }
        }
        setSectionRequirements(targetSection, sections) {
            let target = this.stack.find(s => s.name === targetSection);
            if (target) {
                target.setRequiredSections(sections);
            }
        }
        insertCurrentSetting(setting) {
            if (this.stack.length > 0) {
                let target = this.stack[this.stack.length - 1];
                target.insertSetting(setting);
            }
        }
        /**
         * Returns the setting by name.
         * @param name setting name
         * @param recursive if true searches setting in the whole stack and returns the closest one,
         * otherwise searches setting in the current section
         */
        getCurrentSetting(name, recursive = true) {
            let visitSectionCount = recursive ? this.stack.length : 1;
            for (let i = visitSectionCount; i > 0;) {
                let section = this.stack[--i];
                let value = section.getSetting(name);
                if (value !== void 0) {
                    return value;
                }
            }
            return undefined;
        }
        getSectionSettings(section, recursive = true) {
            let targetIdx = section ? this.stack.findIndex(s => s.name === section) : this.stack.length - 1;
            let result = [];
            if (targetIdx >= 0) {
                let start = recursive ? 0 : targetIdx;
                for (let i = start; i <= targetIdx; i++) {
                    let target = this.stack[i];
                    for (const setting of target.settings) {
                        result.push(setting);
                    }
                }
            }
            return result;
        }
        getSectionRange(section) {
            let node = this.stack.find(s => s.name === section);
            return node ? node.range : null;
        }
        createErrorDiagnostic(section, message) {
            return util_13.createDiagnostic(section.range, message, vscode_languageserver_types_7.DiagnosticSeverity.Error);
        }
        checkDependenciesResolved(startIndex) {
            const stack = this.stack;
            for (let i = stack.length; i > startIndex;) {
                const section = stack[--i];
                if (!section.dependenciesResolved) {
                    let unresolved = section.unresolved.map(s => `[${s}]`);
                    let message;
                    if (unresolved.length > 1) {
                        message = `Required sections ${unresolved.join(", ")} are not declared.`;
                    }
                    else {
                        message = `Required section ${unresolved.join(", ")} is not declared.`;
                    }
                    return this.createErrorDiagnostic(section.range, message);
                }
            }
            return null;
        }
        checkAndGetDepth(sectionRange) {
            const section = sectionRange.text;
            const expectedDepth = this.stack.length;
            let actualDepth = resources_4.sectionDepthMap[section];
            let error = null;
            if (actualDepth == null) {
                error = this.createErrorDiagnostic(sectionRange, `Unknown section [${section}].`);
            }
            else if (actualDepth > expectedDepth) {
                let canBeInherited = resources_4.inheritableSections.has(section);
                if (canBeInherited && expectedDepth > 0) {
                    actualDepth = expectedDepth;
                }
                else {
                    let errorMessage = `Unexpected section [${section}]. `;
                    let expectedSections = Object.entries(resources_4.sectionDepthMap)
                        .filter(([, depth]) => depth === expectedDepth)
                        .map(([key,]) => `[${key}]`);
                    if (expectedSections.length > 1) {
                        errorMessage += `Expected one of ${expectedSections.join(", ")}.`;
                    }
                    else {
                        errorMessage += `Expected ${expectedSections[0]}.`;
                    }
                    error = this.createErrorDiagnostic(sectionRange, errorMessage);
                }
            }
            return [actualDepth, error];
        }
    }
    exports.SectionStack = SectionStack;
});
define("Validator", ["require", "exports", "vscode-languageserver-types", "Config", "configTree/configTree", "configTree/configTreeValidator", "DefaultSetting", "KeywordHandler", "MessageUtil", "Resources", "SectionStackNode", "Setting", "TextRange", "Util"], function (require, exports, vscode_languageserver_types_8, config_1, configTree_1, configTreeValidator_1, defaultSetting_2, keywordHandler_1, messageUtil_6, resources_5, sectionStack_1, setting_7, textRange_2, util_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const placeholderContainingSettings = [
        "url", "urlparameters"
    ];
    /** Regular expressions for CSV syntax checking */
    /**
     * RegExp for: `csv <name> =
     *              <header1>, <header2>`
     */
    const CSV_NEXT_LINE_HEADER_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(=)/m;
    /**
     * RegExp for: 'csv <name> = <header1>, <header2>'
     */
    const CSV_INLINE_HEADER_PATTERN = /=[ \t]*$/m;
    /**
     * RegExp for: 'csv <name> from <url>'
     */
    const CSV_FROM_URL_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(from)/m;
    /**
     * RegExp for blank line
     */
    const BLANK_LINE_PATTERN = /^[ \t]*$/m;
    /**
     * RegExp for 'csv' keyword
     */
    const CSV_KEYWORD_PATTERN = /\b(csv)\b/i;
    /**
     * Performs validation of a whole document line by line.
     */
    class Validator {
        constructor(text) {
            /**
             * Array of declared aliases in the current widget
             */
            this.aliases = [];
            /**
             * Contains sections hierarchy from configuration
             */
            this.sectionStack = new sectionStack_1.SectionStack();
            /**
             * Array of settings declared in current section
             */
            this.currentSettings = [];
            /**
             * Array of de-aliases (value('alias')) in the current widget
             */
            this.deAliases = [];
            /**
             * Map of settings declared in if statement.
             * Key is line number and keyword. For example, "70if server == 'vps'", "29else".
             * Index is used to distinguish statements from each other
             */
            this.ifSettings = new Map();
            /**
             * Stack of nested keywords. For example, if can be included to a for.
             */
            this.keywordsStack = [];
            /**
             * Map of settings declared in parent sections. Keys are section names.
             */
            this.parentSettings = new Map();
            /**
             * Settings declared in the previous section
             */
            this.previousSettings = [];
            /**
             * Settings required to declare in the current section
             */
            this.requiredSettings = [];
            /**
             * Validation result
             */
            this.result = [];
            /**
             * Map of settings in the current widget and their values
             */
            this.settingValues = new Map();
            /**
             * Map of defined variables, where key is type (for, var, csv...)
             */
            this.variables = new Map([
                ["freemarker", ["entity", "entities", "type"]],
            ]);
            /**
             * Line number of last "endif" keyword
             */
            this.lastEndIf = undefined;
            this.configTree = new configTree_1.ConfigTree();
            this.config = new config_1.Config(text);
            this.keywordHandler = new keywordHandler_1.KeywordHandler(this.keywordsStack);
        }
        /**
         * Iterates over the document content line by line
         * @returns diagnostics for all found mistakes
         */
        lineByLine() {
            for (const line of this.config) {
                /**
                 * At the moment 'csv <name> from <url>' supports unclosed syntax
                 */
                let canBeSingle = false;
                if (CSV_KEYWORD_PATTERN.test(line)) {
                    canBeSingle = !CSV_INLINE_HEADER_PATTERN.test(line) && !CSV_NEXT_LINE_HEADER_PATTERN.test(line);
                }
                this.foundKeyword = textRange_2.TextRange.parse(line, this.config.currentLineNumber, canBeSingle);
                if (this.isNotKeywordEnd("script") || this.isNotKeywordEnd("var") || this.isNotKeywordEnd("sql")) {
                    /**
                     * Lines in multiline script and var sections
                     * will be cheked in JavaScriptValidator.processScript() and processVar().
                     * SQL-block must be skipped without any processing.
                     */
                    continue;
                }
                if (this.isNotKeywordEnd("csv")) {
                    this.validateCsv();
                }
                this.eachLine();
                if (this.foundKeyword !== undefined) {
                    if (/\b(if|for|csv)\b/i.test(this.foundKeyword.text)) {
                        this.keywordsStack.push(this.foundKeyword);
                    }
                    this.switchKeyword();
                }
            }
            this.checkAliases();
            this.diagnosticForLeftKeywords();
            this.checkRequredSettingsForSection();
            this.checkUrlPlaceholders();
            this.setSectionToStackAndTree(null);
            /**
             * Apply checks, which require walking through the ConfigTree.
             */
            let rulesDiagnostics = configTreeValidator_1.ConfigTreeValidator.validate(this.configTree);
            /**
             * Ugly hack. Removes duplicates from rulesDiagnostics.
             */
            rulesDiagnostics = [
                ...rulesDiagnostics.reduce(((allItems, item) => allItems.has(item.range) ? allItems : allItems.set(item.range, item)), new Map()).values()
            ];
            this.result.push(...rulesDiagnostics);
            return this.result.concat(this.keywordHandler.diagnostics);
        }
        /**
         * Checks whether has the keyword ended or not
         * @param keyword keyword which is expected to end
         */
        isNotKeywordEnd(keyword) {
            return this.areWeIn(keyword) && (this.foundKeyword === undefined || this.foundKeyword.text !== `end${keyword}`);
        }
        /**
         * Adds all current section setting to parent
         * if they're required by a section
         */
        addCurrentToParentSettings() {
            if (this.currentSection !== undefined) {
                for (const setting of this.currentSettings) {
                    this.addToParentsSettings(this.currentSection.text, setting);
                }
            }
        }
        /**
         * Adds new entry to settingValue map and new Setting to SectionStack
         * based on this.match, also sets value for setting.
         * @param setting setting to which value will be set
         */
        addSettingValue(setting) {
            if (this.match == null) {
                throw new Error("Trying to add new entry to settingValues map and sectionStack based on undefined");
            }
            const value = setting_7.Setting.clearValue(this.match[3]);
            setting.value = value;
            this.settingValues.set(setting.name, value);
        }
        /**
         * Adds a setting based on this.match to array
         * or creates a new diagnostic if setting is already present
         * @param array the target array
         * @returns the array containing the setting from this.match
         */
        addToSettingArray(variable, array) {
            const result = (array === undefined) ? [] : array;
            if (this.match == null) {
                return result;
            }
            const [, indent, name] = this.match;
            if (variable === undefined) {
                return result;
            }
            const declaredAbove = result.find(v => v.name === variable.name);
            if (declaredAbove !== undefined) {
                const range = this.createRange(indent.length, name.length);
                this.result.push(util_14.repetitionDiagnostic(range, declaredAbove, variable));
            }
            else {
                result.push(variable);
            }
            return result;
        }
        /**
         * Adds a setting based on this.match to the target map
         * or creates a new diagnostic if setting is already present
         * @param key the key, which value will contain the setting
         * @param setting which setting to add
         * @returns the map regardless was it modified or not
         */
        addToParentsSettings(key, setting) {
            let array = this.parentSettings.get(key);
            if (array === undefined) {
                array = [setting];
            }
            else {
                array.push(setting);
            }
            this.parentSettings.set(key, array);
        }
        /**
         * Adds a string based on this.match to the array
         * or creates a diagnostic if the string is already present
         * @param array  the target array
         * @returns the array regardless was it modified or not
         */
        addToStringArray(array) {
            const result = array;
            if (this.match == null) {
                return result;
            }
            const [, indent, variable] = this.match;
            if (array.includes(variable)) {
                this.result.push(util_14.createDiagnostic(this.createRange(indent.length, variable.length), `${variable} is already defined`));
            }
            else {
                result.push(variable);
            }
            return result;
        }
        /**
         * Adds a string based on this.match to a value of the provided key
         * @param map the target map
         * @param key the key which value will contain the setting
         * @returns the map regardless was it modified or not
         */
        addToStringMap(map, key) {
            if (this.match == null) {
                return map;
            }
            const [, indent, variable] = this.match;
            if (util_14.isInMap(variable, map)) {
                const startPosition = this.match.index + indent.length;
                this.result.push(util_14.createDiagnostic(this.createRange(startPosition, variable.length), `${variable} is already defined`));
            }
            else {
                let array = map.get(key);
                if (array === undefined) {
                    array = [variable];
                }
                else {
                    array.push(variable);
                }
                map.set(key, array);
            }
            return map;
        }
        /**
         * Tests if keywordsStack contain the provided name or not
         * @param name the target keyword name
         * @return true, if stack contains the keyword, false otherwise
         */
        areWeIn(name) {
            return this.keywordsStack
                .some((textRange) => textRange.text === name);
        }
        /**
         * Checks that each de-alias has corresponding alias
         */
        checkAliases() {
            this.deAliases.forEach((deAlias) => {
                if (!this.aliases.includes(deAlias.text)) {
                    this.result.push(util_14.createDiagnostic(deAlias.range, messageUtil_6.unknownToken(deAlias.text)));
                }
            });
        }
        /**
         * Tests that user has finished a corresponding keyword
         * For instance, user can write "endfor" instead of "endif"
         * @param expectedEnd What the user has finished?
         */
        checkEnd(expectedEnd) {
            if (this.foundKeyword === undefined) {
                return;
            }
            const lastKeyword = this.getLastKeyword();
            if (lastKeyword === expectedEnd) {
                this.keywordsStack.pop();
                return;
            }
            if (!this.areWeIn(expectedEnd)) {
                this.result.push(util_14.createDiagnostic(this.foundKeyword.range, messageUtil_6.noMatching(this.foundKeyword.text, expectedEnd)));
            }
            else {
                const index = this.keywordsStack.findIndex((keyword) => keyword.text === expectedEnd);
                this.keywordsStack.splice(index, 1);
                this.result.push(util_14.createDiagnostic(this.foundKeyword.range, `${expectedEnd} has finished before ${lastKeyword}`));
            }
        }
        /**
         * Check that the section does not contain settings
         * Which are excluded by the specified one
         * @param setting the specified setting
         */
        checkExcludes(setting) {
            if (this.match == null) {
                return;
            }
            const [, indent, name] = this.match;
            for (const item of this.currentSettings) {
                if (setting.excludes.includes(item.displayName)) {
                    const range = this.createRange(indent.length, name.length);
                    this.result.push(util_14.createDiagnostic(range, `${setting.displayName} can not be specified simultaneously with ${item.displayName}`));
                }
            }
        }
        checkFreemarker() {
            const line = this.config.getCurrentLine();
            this.match = /<\/?#.*?\/?>/.exec(line);
            if (this.match !== null) {
                this.result.push(util_14.createDiagnostic(this.createRange(this.match.index, this.match[0].length), `Freemarker expressions are deprecated.\nUse a native collection: list, csv table, var object.` +
                    `\nMigration examples are available at ` +
                    `https://github.com/axibase/charts/blob/master/syntax/freemarker.md`, vscode_languageserver_types_8.DiagnosticSeverity.Information));
                this.match = /(as\s*(\S+)>)/.exec(line);
                if (this.match) {
                    this.addToStringArray(this.aliases);
                }
            }
        }
        /**
         * Creates diagnostics if the current section does not contain required settings.
         */
        checkRequredSettingsForSection() {
            if (this.currentSection === undefined) {
                return;
            }
            if (this.previousSection && /tag/i.test(this.currentSection.text)) {
                /**
                 * [tags] has finished, perform checks for parent section.
                 */
                this.currentSettings = this.previousSettings;
                this.currentSection = this.previousSection;
            }
            const sectionRequirements = resources_5.requiredSectionSettingsMap.get(this.currentSection.text);
            if (!sectionRequirements) {
                return;
            }
            const required = sectionRequirements.settings;
            if (required !== undefined) {
                this.requiredSettings = required.concat(this.requiredSettings);
            }
            const notFound = [];
            required: for (const options of this.requiredSettings) {
                const displayName = options[0].displayName;
                if (displayName === "metric") {
                    const columnMetric = this.settingValues.get("columnmetric");
                    const columnValue = this.settingValues.get("columnvalue");
                    if (columnMetric === "null" && columnValue === "null") {
                        continue;
                    }
                    const changeField = this.settingValues.get("changefield");
                    if (/metric/.test(changeField)) {
                        continue;
                    }
                }
                const optionsNames = options.map(s => s.name);
                if (util_14.isAnyInArray(optionsNames, this.currentSettings.map(s => s.name))) {
                    continue;
                }
                for (const array of this.parentSettings.values()) {
                    // Trying to find in this section parents
                    if (util_14.isAnyInArray(optionsNames, array.map(s => s.name))) {
                        continue required;
                    }
                }
                if (this.ifSettings.size > 0) {
                    for (const array of this.ifSettings.values()) {
                        // Trying to find in each one of if-elseif-else... statement
                        if (!util_14.isAnyInArray(optionsNames, array.map(s => s.name))) {
                            notFound.push(displayName);
                            continue required;
                        }
                    }
                    const curSectLine = this.currentSection.range.end.line;
                    const lastCondLine = parseInt(this.lastCondition.match(/^\d+/)[0], 10);
                    if ( // if-elseif-else statement inside the section
                    this.areWeIn("if") ||
                        // section inside the if-elseif-else statement
                        curSectLine < this.lastEndIf && curSectLine > lastCondLine) {
                        continue;
                    }
                    let ifCounter = 0;
                    let elseCounter = 0;
                    for (const statement of this.ifSettings.keys()) {
                        if (/\bif\b/.test(statement)) {
                            ifCounter++;
                        }
                        else if (/\belse\b/.test(statement)) {
                            elseCounter++;
                        }
                    }
                    if (ifCounter === elseCounter) {
                        continue;
                    }
                }
                notFound.push(displayName);
            }
            for (const option of notFound) {
                this.result.push(util_14.createDiagnostic(this.currentSection.range, `${option} is required`));
            }
            this.requiredSettings.splice(0, this.requiredSettings.length);
        }
        /**
         * Creates a new diagnostic if the provided setting is defined
         * @param setting the setting to perform check
         */
        checkRepetition(setting) {
            if (this.match == null) {
                return;
            }
            const [, indent, name] = this.match;
            const range = this.createRange(indent.length, name.length);
            if (this.areWeIn("if")) {
                if (this.lastCondition === undefined) {
                    throw new Error("We are in if, but last condition is undefined");
                }
                let array = this.ifSettings.get(this.lastCondition);
                array = this.addToSettingArray(setting, array);
                this.ifSettings.set(this.lastCondition, array);
                const declaredAbove = this.currentSettings.find(v => v.name === setting.name);
                if (declaredAbove !== undefined) {
                    // The setting was defined before if
                    this.result.push(util_14.repetitionDiagnostic(range, declaredAbove, setting));
                    return;
                }
            }
            else {
                this.addToSettingArray(setting, this.currentSettings);
            }
            this.sectionStack.insertCurrentSetting(setting);
        }
        /**
         * Creates diagnostics for all unclosed keywords
         */
        diagnosticForLeftKeywords() {
            for (const nestedConstruction of this.keywordsStack) {
                if (nestedConstruction.canBeUnclosed) {
                    continue;
                }
                this.result.push(util_14.createDiagnostic(nestedConstruction.range, messageUtil_6.noMatching(nestedConstruction.text, `end${nestedConstruction.text}`)));
            }
        }
        /**
         * Handles every line in the document, calls corresponding functions
         */
        eachLine() {
            this.checkFreemarker();
            const line = this.config.getCurrentLine();
            this.match = /(^[\t ]*\[)(\w+)\][\t ]*/.exec(line);
            if ( // Section declaration, for example, [widget]
            this.match !== null ||
                /**
                 * We are in [tags] section and current line is empty - [tags] section has finished
                 */
                (line.trim().length === 0 && this.currentSection !== undefined && this.currentSection.text === "tags")) {
                // We met start of the next section, that means that current section has finished
                if (this.match !== null) {
                    this.spellingCheck();
                }
                this.handleSection();
            }
            else {
                this.match = /(^\s*)([a-z].*?[a-z])\s*=\s*(.*?)\s*$/.exec(line);
                if (this.match !== null) {
                    // Setting declaration, for example, width-units = 6.2
                    this.checkSettingsWhitespaces();
                    this.handleSettings();
                    if (this.areWeIn("for")) {
                        this.validateFor();
                    }
                }
                this.match = /(^\s*\[)(\w+)\s*$/.exec(line);
                if (this.match !== null) {
                    this.result.push(util_14.createDiagnostic(this.createRange(this.match[1].length, this.match[2].length), "Section tag is unclosed"));
                }
            }
        }
        /**
         * Adds all de-aliases from the line to the corresponding array
         */
        findDeAliases() {
            const line = this.config.getCurrentLine();
            const regexp = /value\((['"])(\S+?)\1\)/g;
            const deAliasPosition = 2;
            let freemarkerExpr;
            let deAlias;
            this.match = regexp.exec(line);
            while (this.match !== null) {
                deAlias = this.match[deAliasPosition];
                freemarkerExpr = /(\$\{(\S+)\})/.exec(deAlias);
                if (freemarkerExpr) {
                    // extract "lpar" from value('${lpar}PX')
                    deAlias = freemarkerExpr[deAliasPosition];
                }
                this.deAliases.push(new textRange_2.TextRange(deAlias, this.createRange(line.indexOf(deAlias), deAlias.length)));
                this.match = regexp.exec(line);
            }
        }
        /**
         * Returns the keyword from the top of keywords stack without removing it
         * @returns the keyword which is on the top of keywords stack
         */
        getLastKeyword() {
            if (this.keywordsStack.length === 0) {
                return undefined;
            }
            const stackHead = this.keywordsStack[this.keywordsStack.length - 1];
            return stackHead.text;
        }
        /**
         * Creates a diagnostic about unknown setting name or returns the setting
         * @returns undefined if setting is unknown, setting otherwise
         */
        getSettingCheck() {
            if (this.match == null) {
                return undefined;
            }
            const settingName = this.match[2];
            let setting = this.getSetting(settingName);
            if (setting === undefined) {
                if (/column-/.test(settingName)) {
                    return undefined;
                }
                if (textRange_2.TextRange.KEYWORD_REGEXP.test(settingName)) {
                    return undefined;
                }
                if (this.currentSection !== undefined && (this.currentSection.text === "placeholders" ||
                    this.currentSection.text === "properties")) {
                    /**
                     * Return Setting instead of undefined because SectionStack.getSectionSettings(),
                     * which is used in checkUrlPlaceholders(), returns Setting[] instead of Map<string, any>
                     */
                    setting = new setting_7.Setting(new defaultSetting_2.DefaultSetting());
                    Object.assign(setting, { name: settingName, section: this.currentSection.text });
                    return setting;
                }
                const message = messageUtil_6.unknownToken(settingName);
                this.result.push(util_14.createDiagnostic(this.createRange(this.match[1].length, settingName.length), message));
                return undefined;
            }
            setting = setting.applyScope({
                section: this.currentSection ? this.currentSection.text.trim() : "",
                widget: this.currentWidget || "",
            });
            return setting;
        }
        /**
         * Calculates the number of columns in the found csv header
         */
        handleCsv() {
            const line = this.config.getCurrentLine();
            let header = null;
            if (CSV_INLINE_HEADER_PATTERN.exec(line)) {
                let j = this.config.currentLineNumber + 1;
                header = this.config.getLine(j);
                while (header !== null && BLANK_LINE_PATTERN.test(header)) {
                    header = this.config.getLine(++j);
                }
            }
            else {
                let match = CSV_NEXT_LINE_HEADER_PATTERN.exec(line) || CSV_FROM_URL_PATTERN.exec(line);
                if (match !== null) {
                    this.match = match;
                    header = line.substring(this.match.index + 1);
                }
                else {
                    this.result.push(util_14.createDiagnostic(this.foundKeyword.range, messageUtil_6.getCsvErrorMessage(line)));
                }
            }
            this.addToStringMap(this.variables, "csvNames");
            this.csvColumns = (header === null) ? 0 : util_14.countCsvColumns(header);
        }
        /**
         * Creates a diagnostic if `else` is found, but `if` is not
         * or `if` is not the last keyword
         */
        handleElse() {
            if (this.foundKeyword === undefined) {
                throw new Error(`We're trying to handle 'else ', but foundKeyword is ${this.foundKeyword}`);
            }
            this.setLastCondition();
            let message;
            if (!this.areWeIn("if")) {
                message = messageUtil_6.noMatching(this.foundKeyword.text, "if");
            }
            else if (this.getLastKeyword() !== "if") {
                message = `${this.foundKeyword.text} has started before ${this.getLastKeyword()} has finished`;
            }
            if (message !== undefined) {
                this.result.push(util_14.createDiagnostic(this.foundKeyword.range, message));
            }
        }
        /**
         * Removes the variable from the last `for`
         */
        handleEndFor() {
            let forVariables = this.variables.get("forVariables");
            if (forVariables === undefined) {
                forVariables = [];
            }
            else {
                forVariables.pop();
            }
            this.variables.set("forVariables", forVariables);
        }
        /**
         * Creates diagnostics related to `for ... in _here_` statements
         * Like "for srv in servers", but "servers" is not defined
         * Also adds the new `for` variable to the corresponding map
         */
        handleFor() {
            const line = this.config.getCurrentLine();
            // groups are used in addToStringMap
            this.match = /(^\s*for\s+)(\w+)\s+in\s*/m.exec(line);
            if (this.match != null) {
                const collection = line.substring(this.match[0].length).trim();
                if (collection !== "") {
                    const regs = [
                        /^Object\.keys\((\w+)(?:\.\w+)*\)$/i,
                        /^(\w+)\.values\((["'])\w+\2\)$/i,
                        /^(\w+)(\[\d+\])*$/i // apps, apps[1]
                    ];
                    let varName;
                    for (const regex of regs) {
                        const matched = regex.exec(collection);
                        varName = matched ? matched[1] : null;
                        if (varName) {
                            break;
                        }
                    }
                    if (!varName) {
                        try {
                            /**
                             * Check for inline declaration, for example:
                             * for widgetType in ['chart', 'calendar']
                             */
                            Function(`return ${collection}`);
                        }
                        catch (err) {
                            const start = line.indexOf(collection);
                            this.result.push(util_14.createDiagnostic(this.createRange(start, collection.length), "Incorrect collection declaration."));
                        }
                    }
                    else if (!util_14.isInMap(varName, this.variables)) {
                        const message = messageUtil_6.unknownToken(varName);
                        const start = line.lastIndexOf(varName);
                        this.result.push(util_14.createDiagnostic(this.createRange(start, varName.length), message));
                    }
                }
                else {
                    const start = this.match[0].indexOf("in");
                    this.result.push(util_14.createDiagnostic(this.createRange(start, "in".length), "Empty 'in' statement"));
                }
                this.addToStringMap(this.variables, "forVariables");
            }
        }
        /**
         * Adds new variable to corresponding map,
         * Pushes a new keyword to the keyword stack
         * If necessary (`list hello = value1, value2` should not be closed)
         */
        handleList() {
            if (this.foundKeyword === undefined) {
                throw new Error(`We're trying to handle 'list', but foundKeyword is undefined`);
            }
            const line = this.config.getCurrentLine();
            this.match = /(^\s*list\s+)(\w+)\s*=/.exec(line);
            this.addToStringMap(this.variables, "listNames");
            if (/(=|,)[ \t]*$/m.test(line)) {
                this.keywordsStack.push(this.foundKeyword);
            }
            else {
                let j = this.config.currentLineNumber + 1;
                let nextLine = this.config.getLine(j);
                while (nextLine !== null && /^[ \t]*$/m.test(nextLine)) {
                    nextLine = this.config.getLine(++j);
                }
                if (nextLine !== null && (/^[ \t]*,/.test(nextLine) || /\bendlist\b/.test(nextLine))) {
                    this.keywordsStack.push(this.foundKeyword);
                }
            }
        }
        /**
         * Performs required operations after a section has finished.
         * Mostly empties arrays.
         */
        handleSection() {
            if (this.match == null) {
                if (this.previousSection !== undefined) {
                    this.currentSection = this.previousSection;
                    this.currentSettings = this.previousSettings;
                }
                return;
            }
            const [, indent, name] = this.match;
            const nextIsTags = this.currentSection && /tag/i.test(name);
            if (!nextIsTags) {
                /**
                 * If the next is [tags], no need to perform checks for current section now,
                 * they will be done after [tags] section finished.
                 */
                this.checkRequredSettingsForSection();
                this.addCurrentToParentSettings();
                if (/widget/i.test(name)) {
                    this.checkAliases();
                    this.deAliases.splice(0, this.deAliases.length);
                    this.aliases.splice(0, this.aliases.length);
                    this.settingValues.clear();
                }
                this.checkUrlPlaceholders();
                this.ifSettings.clear();
            }
            this.previousSettings = this.currentSettings.splice(0, this.currentSettings.length);
            this.previousSection = this.currentSection;
            this.currentSection = new textRange_2.TextRange(name, this.createRange(indent.length, name.length));
            this.parentSettings.delete(this.currentSection.text);
            this.setSectionToStackAndTree(this.currentSection);
        }
        /**
         * Attempts to add section to section stack, displays error if section
         * is out ouf hierarchy, unknown or has unresolved section dependencies
         * If section is null, finalizes section stack and return summary error
         * Adds last section of stack to ConfigTree.
         * @param section section to add or null
         */
        setSectionToStackAndTree(section) {
            let sectionStackError;
            const lastSection = this.sectionStack.getLastSection();
            if (lastSection) {
                this.configTree.addSection(lastSection.range, lastSection.settings);
            }
            if (section == null) {
                sectionStackError = this.sectionStack.finalize();
            }
            else {
                sectionStackError = this.sectionStack.insertSection(this.currentSection);
            }
            if (sectionStackError) {
                this.result.push(sectionStackError);
            }
        }
        /**
         * Calls functions in proper order to handle a found setting
         */
        handleSettings() {
            if (this.match == null) {
                return;
            }
            const line = this.config.getCurrentLine();
            if (this.currentSection === undefined || !/(?:tag|key)s?/.test(this.currentSection.text)) {
                this.handleRegularSetting();
            }
            else if (/(?:tag|key)s?/.test(this.currentSection.text) &&
                // We are in tags/keys section
                /(^[ \t]*)([a-z].*?[a-z])[ \t]*=/.test(line)) {
                this.match = /(^[ \t]*)([a-z].*?[a-z])[ \t]*=/.exec(line);
                if (this.match === null) {
                    return;
                }
                const [, indent, name] = this.match;
                const setting = this.getSetting(name);
                if (this.isAllowedWidget(setting)) {
                    this.result.push(util_14.createDiagnostic(this.createRange(indent.length, name.length), messageUtil_6.settingNameInTags(name), vscode_languageserver_types_8.DiagnosticSeverity.Information));
                }
            }
        }
        /**
         * Checks whether the setting is defined and is allowed to be defined in the current widget
         * @param setting the setting to be checked
         */
        isAllowedWidget(setting) {
            return setting !== undefined
                && this.currentSection.text !== "tag"
                && (setting.widget == null
                    || this.currentWidget === undefined
                    || setting.widget === this.currentWidget);
        }
        /**
         * Return true if the setting is allowed to be defined in the current section.
         * @param setting The setting to be checked.
         */
        isAllowedInSection(setting) {
            if (setting.section == null || this.currentSection == null) {
                return true;
            }
            const currDepth = resources_5.sectionDepthMap[this.currentSection.text];
            if (setting.name === "mode") {
                if (this.currentWidget == null) {
                    return true;
                }
                if (this.currentWidget === "chart") {
                    if (setting.value === "column-stack") {
                        return currDepth <= resources_5.sectionDepthMap.widget;
                    }
                    return currDepth <= resources_5.sectionDepthMap.series;
                }
            }
            if (Array.isArray(setting.section)) {
                return setting.section.some(s => currDepth <= resources_5.sectionDepthMap[s]);
            }
            else {
                const reqDepth = resources_5.sectionDepthMap[setting.section];
                return currDepth <= reqDepth;
            }
        }
        /**
         * Processes a regular setting which is defined not in tags/keys section
         */
        handleRegularSetting() {
            const line = this.config.getCurrentLine();
            const setting = this.getSettingCheck();
            if (setting === undefined) {
                return;
            }
            this.addSettingValue(setting);
            /**
             * Show hint if setting is deprecated
             */
            if (setting.deprecated) {
                this.result.push(util_14.createDiagnostic(setting.textRange, setting.deprecated, vscode_languageserver_types_8.DiagnosticSeverity.Warning));
            }
            if (!this.isAllowedInSection(setting)) {
                this.result.push(util_14.createDiagnostic(setting.textRange, messageUtil_6.illegalSetting(setting.displayName), vscode_languageserver_types_8.DiagnosticSeverity.Error));
            }
            if (setting.name === "type") {
                this.currentWidget = this.match[3];
                let reqs = resources_5.widgetRequirementsByType.get(this.currentWidget);
                if (reqs && reqs.sections) {
                    this.sectionStack.setSectionRequirements("widget", reqs.sections);
                }
            }
            if (!setting.multiLine) {
                this.checkRepetition(setting);
            }
            else {
                this.currentSettings.push(setting);
                this.sectionStack.insertCurrentSetting(setting);
            }
            if (!(this.currentSection && ["placeholders", "properties", "property"].includes(this.currentSection.text))) {
                this.typeCheck(setting);
                this.checkExcludes(setting);
                // Aliases
                if (setting.name === "alias") {
                    this.match = /(^\s*alias\s*=\s*)(\S+)\s*$/m.exec(line);
                    this.addToStringArray(this.aliases);
                }
                this.findDeAliases();
            }
        }
        /**
         * Check if settings or tag key contains whitespace and warn about it.
         * Ignore any settings in [properties] section.
         */
        checkSettingsWhitespaces() {
            const line = this.config.getCurrentLine();
            const match = /(^\s*)((\w+\s+)+\w+)\s*=\s*(.+?)\s*$/.exec(line);
            if (match != null && match[2]) {
                const settingName = match[2];
                if (settingName && !this.foundKeyword && /^\w+(\s.*\w)+$/.test(settingName)) {
                    const start = line.indexOf(settingName);
                    const range = this.createRange(start, settingName.length);
                    if (this.currentSection.text === "tags") {
                        if (!/^["].+["]$/.test(settingName)) {
                            this.result.push(util_14.createDiagnostic(range, messageUtil_6.tagNameWithWhitespaces(settingName), vscode_languageserver_types_8.DiagnosticSeverity.Warning));
                        }
                    }
                    else if (this.currentSection.text !== "properties") {
                        this.result.push(util_14.createDiagnostic(range, messageUtil_6.settingsWithWhitespaces(settingName), vscode_languageserver_types_8.DiagnosticSeverity.Warning));
                    }
                }
            }
        }
        /**
         * Updates the lastCondition field
         */
        setLastCondition() {
            this.lastCondition = `${this.config.currentLineNumber}${this.config.getCurrentLine()}`;
        }
        /**
         * Checks spelling mistakes in a section name
         */
        spellingCheck() {
            if (this.match == null) {
                return;
            }
            const indent = this.match[1].length;
            const word = this.match[2];
            const range = this.createRange(indent, word.length);
            if (word === "tag") {
                this.result.push(util_14.createDiagnostic(range, messageUtil_6.deprecatedTagSection, vscode_languageserver_types_8.DiagnosticSeverity.Warning));
            }
        }
        /**
         * Calls corresponding functions for the found keyword
         */
        switchKeyword() {
            if (this.foundKeyword === undefined) {
                throw new Error(`We're trying to handle a keyword, but foundKeyword is undefined`);
            }
            const line = this.config.getCurrentLine();
            switch (this.foundKeyword.text) {
                case "endfor":
                    this.handleEndFor();
                case "endif":
                    this.lastEndIf = this.config.currentLineNumber;
                case "endvar":
                case "endcsv":
                case "endlist":
                case "endsql":
                case "endscript": {
                    const expectedEnd = this.foundKeyword.text.substring("end".length);
                    this.checkEnd(expectedEnd);
                    break;
                }
                case "else":
                case "elseif": {
                    this.handleElse();
                    break;
                }
                case "csv": {
                    this.handleCsv();
                    break;
                }
                case "var": {
                    const openBrackets = line.match(/((\s*[\[\{\(]\s*)+)/g);
                    const closeBrackets = line.match(/((\s*[\]\}\)]\s*)+)/g);
                    if (openBrackets) {
                        if (closeBrackets && openBrackets.map((s) => s.trim()).join("").length !==
                            closeBrackets.map((s) => s.trim()).join("").length
                            || closeBrackets === null) {
                            // multiline var
                            this.keywordsStack.push(this.foundKeyword);
                        }
                    }
                    this.match = /(var\s*)(\w+)\s*=/.exec(line);
                    this.addToStringMap(this.variables, "varNames");
                    break;
                }
                case "list": {
                    this.handleList();
                    break;
                }
                case "for": {
                    this.handleFor();
                    break;
                }
                case "if": {
                    const regex = /!=|==/;
                    if (!regex.test(line)) {
                        this.result.push(util_14.createDiagnostic(this.foundKeyword.range, `Specify == or !=`));
                    }
                    this.setLastCondition();
                    break;
                }
                case "script": {
                    this.keywordHandler.handleScript(line, this.foundKeyword);
                    break;
                }
                case "sql": {
                    this.keywordHandler.handleSql(line, this.foundKeyword);
                    break;
                }
                case "import":
                    break;
                default:
                    throw new Error(`${this.foundKeyword.text} is not handled`);
            }
        }
        /**
         * Performs type checks for the found setting value
         * @param setting the setting to be checked
         */
        typeCheck(setting) {
            if (this.match == null) {
                return;
            }
            const range = this.createRange(this.match[1].length, this.match[2].length);
            const diagnostic = setting.checkType(range);
            if (diagnostic != null) {
                this.result.push(diagnostic);
            }
        }
        /**
         * Creates diagnostics for a CSV line containing wrong columns number
         */
        validateCsv() {
            const line = this.config.getCurrentLine();
            const columns = util_14.countCsvColumns(line);
            if (columns !== this.csvColumns && !/^[ \t]*$/m.test(line)) {
                this.result.push(util_14.createDiagnostic(this.createRange(0, line.length), `Expected ${this.csvColumns} columns, but found ${columns}`));
            }
        }
        /**
         * Creates diagnostics for unknown variables in `for` keyword
         * like `for srv in servers setting = @{server} endfor`
         * but `server` is undefined
         */
        validateFor() {
            const line = this.config.getCurrentLine();
            const atRegexp = /@{.+?}/g;
            this.match = atRegexp.exec(line);
            while (this.match !== null) {
                const substr = this.match[0];
                const startPosition = this.match.index;
                const varRegexp = /[a-zA-Z_]\w*(?!\w*["\('])/g;
                this.match = varRegexp.exec(substr);
                while (this.match !== null) {
                    if (substr.charAt(this.match.index - 1) === ".") {
                        this.match = varRegexp.exec(substr);
                        continue;
                    }
                    const variable = this.match[0];
                    if (!util_14.isInMap(variable, this.variables)) {
                        const position = startPosition + this.match.index;
                        const message = messageUtil_6.unknownToken(variable);
                        this.result.push(util_14.createDiagnostic(this.createRange(position, variable.length), message));
                    }
                    this.match = varRegexp.exec(substr);
                }
                this.match = atRegexp.exec(line);
            }
        }
        getSetting(name) {
            const line = this.config.getCurrentLine();
            const start = line.indexOf(name);
            const range = (start > -1) ? this.createRange(start, name.length) : undefined;
            return util_14.getSetting(name, range);
        }
        checkUrlPlaceholders() {
            let phs = this.getUrlPlaceholders();
            if (phs.length > 0) {
                if (this.currentSection && this.currentSection.text.match(/widget/i)) {
                    this.sectionStack.requireSections("widget", "placeholders");
                }
            }
            let placeholderRange = this.sectionStack.getSectionRange("placeholders");
            if (placeholderRange) {
                let phSectionSettings = this.sectionStack.getSectionSettings("placeholders", false);
                let missingPhs = phs.filter(key => {
                    const cleared = setting_7.Setting.clearValue(key);
                    return phSectionSettings.find(s => s.name === cleared) == null;
                });
                if (missingPhs.length > 0) {
                    this.result.push(util_14.createDiagnostic(placeholderRange.range, `Missing placeholders: ${missingPhs.join(", ")}.`, vscode_languageserver_types_8.DiagnosticSeverity.Error));
                }
                let unnecessaryPhs = phSectionSettings.filter(s => !phs.includes(s.name)).map(s => s.name);
                if (unnecessaryPhs.length > 0) {
                    this.result.push(util_14.createDiagnostic(placeholderRange.range, `Unnecessary placeholders: ${unnecessaryPhs.join(", ")}.`, vscode_languageserver_types_8.DiagnosticSeverity.Warning));
                }
            }
        }
        /**
         * Returns all placeholders declared before the current line.
         */
        getUrlPlaceholders() {
            let result = new Set();
            for (let setting of placeholderContainingSettings) {
                let currentSetting = this.sectionStack.getCurrentSetting(setting);
                if (currentSetting) {
                    const regexp = /{(.+?)}/g;
                    let match = regexp.exec(currentSetting.value);
                    while (match !== null) {
                        const cleared = setting_7.Setting.clearSetting(match[1]);
                        result.add(cleared);
                        match = regexp.exec(currentSetting.value);
                    }
                }
            }
            // @ts-ignore
            return [...result];
        }
        /**
         * Creates Range object for the current line.
         *
         * @param start - The starting position in the string
         * @param length - Length of the word to be highlighted
         * @returns Range object with start equal to `start` and end equal to `start+length`
         */
        createRange(start, length) {
            return util_14.createRange(start, length, this.config.currentLineNumber);
        }
    }
    exports.Validator = Validator;
});
