var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "vscode-languageserver-types"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var vscode_languageserver_types_1 = require("vscode-languageserver-types");
    var DIAGNOSTIC_SOURCE = "Axibase Charts";
    var Util = /** @class */ (function () {
        function Util() {
        }
        /**
         * @param value the value to find
         * @param map the map to search
         * @returns true if at least one value in map is/contains the wanted value
         */
        Util.isInMap = function (value, map) {
            var e_1, _a, e_2, _b;
            if (value == null) {
                return false;
            }
            try {
                for (var _c = __values(map.values()), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var array = _d.value;
                    try {
                        for (var array_1 = (e_2 = void 0, __values(array)), array_1_1 = array_1.next(); !array_1_1.done; array_1_1 = array_1.next()) {
                            var item = array_1_1.value;
                            if ((Array.isArray(item) && item.includes(value)) || (item === value)) {
                                return true;
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (array_1_1 && !array_1_1.done && (_b = array_1.return)) _b.call(array_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return false;
        };
        /**
         * @param target array of aliases
         * @param array array to perform the search
         * @returns true, if array contains a value from target
         */
        Util.isAnyInArray = function (target, array) {
            var e_3, _a;
            try {
                for (var target_1 = __values(target), target_1_1 = target_1.next(); !target_1_1.done; target_1_1 = target_1.next()) {
                    var item = target_1_1.value;
                    if (array.includes(item)) {
                        return true;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (target_1_1 && !target_1_1.done && (_a = target_1.return)) _a.call(target_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return false;
        };
        /**
         * Counts CSV columns using RegExp.
         * @param line a CSV-formatted line
         * @returns number of CSV columns in the line
         */
        Util.countCsvColumns = function (line) {
            if (line.length === 0) {
                return 0;
            }
            var lineWithoutEscapes = line.replace(/(['"]).+\1/g, ""); // remove strings in quotes "6,3" or "6 3"
            return lineWithoutEscapes.split(",").length;
        };
        /**
         * Short-hand to create a diagnostic with undefined code and a standardized source
         * @param range Where is the mistake?
         * @param severity How severe is that problem?
         * @param message What message should be passed to the user?
         */
        Util.createDiagnostic = function (range, message, severity) {
            if (severity === void 0) { severity = vscode_languageserver_types_1.DiagnosticSeverity.Error; }
            return vscode_languageserver_types_1.Diagnostic.create(range, message, severity, undefined, DIAGNOSTIC_SOURCE);
        };
        /**
         * Replaces all comments with spaces.
         * We need to remember places of statements in the original configuration,
         * that's why it is not possible to delete all comments, whereas they must be ignored.
         * @param text the text to replace comments
         * @returns the modified text
         */
        Util.deleteComments = function (text) {
            var content = text;
            var multiLine = /\/\*[\s\S]*?\*\//g;
            var oneLine = /^[ \t]*#.*/mg;
            var match = multiLine.exec(content);
            if (match === null) {
                match = oneLine.exec(content);
            }
            while (match !== null) {
                var newLines = match[0].split("\n").length - 1;
                var spaces = Array(match[0].length)
                    .fill(" ")
                    .concat(Array(newLines).fill("\n"))
                    .join("");
                content = "" + content.substr(0, match.index) + spaces + content.substr(match.index + match[0].length);
                match = multiLine.exec(content);
                if (match === null) {
                    match = oneLine.exec(content);
                }
            }
            return content;
        };
        /**
         * Replaces scripts body with newline character
         * @param text the text to perform modifications
         * @returns the modified text
         */
        Util.deleteScripts = function (text) {
            return text.replace(/\bscript\b([\s\S]+?)\bendscript\b/g, "script\nendscript");
        };
        /**
         * Creates a diagnostic for a repeated setting. Warning if this setting was
         * multi-line previously, but now it is deprecated, error otherwise.
         * @param range The range where the diagnostic will be displayed
         * @param declaredAbove The setting, which has been declared earlier
         * @param current The current setting
         */
        Util.repetitionDiagnostic = function (range, declaredAbove, current) {
            var diagnosticSeverity = (["script", "thresholds", "colors"].includes(current.name)) ?
                vscode_languageserver_types_1.DiagnosticSeverity.Warning : vscode_languageserver_types_1.DiagnosticSeverity.Error;
            var message;
            switch (current.name) {
                case "script": {
                    message =
                        "Multi-line scripts are deprecated.\nGroup multiple scripts into blocks:\nscript\nendscript";
                    break;
                }
                case "thresholds": {
                    message = "Replace multiple `thresholds` settings with one, for example:\nthresholds = 0\nthresholds = 60\nthresholds = 80\n\nthresholds = 0, 60, 80";
                    declaredAbove.values.push(current.value);
                    break;
                }
                case "colors": {
                    message = "Replace multiple `colors` settings with one, for example:\ncolors = red\ncolors = yellow\ncolors = green\n\ncolors = red, yellow, green";
                    declaredAbove.values.push(current.value);
                    break;
                }
                default:
                    message = declaredAbove.displayName + " is already defined";
            }
            return Util.createDiagnostic(range, message, diagnosticSeverity);
        };
        /**
         * @returns true if the current line contains white spaces or nothing, false otherwise
         */
        Util.isEmpty = function (str) {
            return /^\s*$/.test(str);
        };
        /**
         * Creates Range object.
         *
         * @param start - The starting position in the string
         * @param length - Length of the word to be highlighted
         * @param lineNumber - Number of line, where is the word to be highlighted
         * @returns Range object with start equal to `start` and end equal to `start+length` and line equal to `lineNumber`
         */
        Util.createRange = function (start, length, lineNumber) {
            return vscode_languageserver_types_1.Range.create(vscode_languageserver_types_1.Position.create(lineNumber, start), vscode_languageserver_types_1.Position.create(lineNumber, start + length));
        };
        return Util;
    }());
    exports.Util = Util;
});
