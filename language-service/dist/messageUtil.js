(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Creates a error message for unknown setting or value.
     * @param found the variant found in the user's text
     * @returns message with or without a suggestion
     */
    exports.unknownToken = function (found) { return found + " is unknown."; };
    exports.deprecatedTagSection = "Replace [tag] sections with [tags].\nEnclose the tag name in double quotes in case it contains special characters.\n\n[tag]\n  name = k\n  value = v\n[tag]\n  name = my column\n  value = my value\n\n[tags]\n  k = v\n  \"my column\" = my value\n";
    exports.settingsWithWhitespaces = function (found) {
        return "The setting \"" + found + "\" contains whitespaces.\nReplace spaces with hyphens.";
    };
    exports.tagNameWithWhitespaces = function (found) {
        return "The tag name " + found + " contains whitespaces. Wrap it in double quotes.";
    };
    exports.settingNameInTags = function (found) {
        return found + " is interpreted as a series tag and is sent to the\nserver. " +
            "Move the setting outside of the [tags] section or\n" +
            "enclose in double-quotes to send it to the server without\na warning.";
    };
    exports.uselessScope = function (found, msg) {
        return found + " setting is appplied only if " + msg + ".";
    };
    exports.incorrectColors = function (found, msg) {
        return "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.\nCurrent: " + found + ", expected: " + msg;
    };
    exports.illegalSetting = function (found) {
        return found + " setting is not allowed here.";
    };
    /**
     * RegExp for: 'csv from <url>'
     */
    var CSV_FROM_URL_MISSING_NAME_PATTERN = /(^[ \t]*csv[ \t]+)[ \t]*(from)/;
    /**
     * If SCV pattern didn't match any known RegExp, compose error message
     * @param line line of code instruction
     * @returns csv error message
     */
    exports.getCsvErrorMessage = function (line) {
        return (CSV_FROM_URL_MISSING_NAME_PATTERN.test(line)) ? "<name> in 'csv <name> from <url>' is missing" :
            "The line should contain a '=' or 'from' keyword";
    };
    exports.noRequiredSetting = function (dependent, required) {
        return required + " is required if " + dependent + " is specified";
    };
    exports.noRequiredSettings = function (dependent, required) {
        return dependent + " has effect only with one of the following:\n * " + required.join("\n * ");
    };
    exports.noMatching = function (dependent, required) {
        return dependent + " has no matching " + required;
    };
    exports.lineFeedRequired = function (dependent) {
        return "A linefeed character after '" + dependent + "' keyword is required";
    };
});
