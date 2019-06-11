define(["require", "exports"], function (require, exports) {
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
