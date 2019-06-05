define(["require", "exports", "vscode-languageserver-types", "./resources", "./setting"], function (require, exports, vscode_languageserver_types_1, resources_1, setting_1) {
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
