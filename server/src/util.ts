import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode-languageserver-types";
import { settingsMap } from "./resources";
import { Setting } from "./setting";

const DIAGNOSTIC_SOURCE: string = "Axibase Charts";

/**
 * @param value the value to find
 * @param map the map to search
 * @returns true if at least one value in map is/contains the wanted value
 */
export function isInMap<T>(value: T, map: Map<string, T[]> | Map<string, T[][]>): boolean {
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

/**
 * @param target array of aliases
 * @param array array to perform the search
 * @returns true, if array contains a value from target
 */
export function isAnyInArray<T>(target: T[], array: T[]): boolean {
    for (const item of target) {
        if (array.includes(item)) {
            return true;
        }
    }

    return false;
}

/**
 * Clears the passed argument and looks for a setting with the same name
 * @param name name of the wanted setting
 * @param range TextRange of the setting in text.
 * @returns the wanted setting or undefined if not found
 */
export function getSetting(name: string, range?: Range): Setting | undefined {
    const clearedName: string = Setting.clearSetting(name);

    const defaultSetting = settingsMap.get(clearedName);
    if (defaultSetting === undefined) {
        return undefined;
    }
    const setting = new Setting(defaultSetting);
    if (range) {
        setting.textRange = range;
    }
    return setting;
}

/**
 * Counts CSV columns using RegExp.
 * @param line a CSV-formatted line
 * @returns number of CSV columns in the line
 */
export function countCsvColumns(line: string): number {
    if (line.length === 0) {
        return 0;
    }
    const lineWithoutEscapes = line.replace(/(['"]).+\1/g, ""); // remove strings in quotes "6,3" or "6 3"
    return lineWithoutEscapes.split(",").length;
}

/**
 * Short-hand to create a diagnostic with undefined code and a standardized source
 * @param range Where is the mistake?
 * @param severity How severe is that problem?
 * @param message What message should be passed to the user?
 */
export function createDiagnostic(
    range: Range,
    message: string,
    severity: DiagnosticSeverity = DiagnosticSeverity.Error,
): Diagnostic {
    return Diagnostic.create(range, message, severity, undefined, DIAGNOSTIC_SOURCE);
}

/**
 * Replaces all comments with spaces.
 * We need to remember places of statements in the original configuration,
 * that's why it is not possible to delete all comments, whereas they must be ignored.
 * @param text the text to replace comments
 * @returns the modified text
 */
export function deleteComments(text: string): string {
    let content: string = text;
    const multiLine: RegExp = /\/\*[\s\S]*?\*\//g;
    const oneLine: RegExp = /^[ \t]*#.*/mg;
    let match: RegExpExecArray | null = multiLine.exec(content);
    if (match === null) {
        match = oneLine.exec(content);
    }

    while (match !== null) {
        const newLines: number = match[0].split("\n").length - 1;
        const spaces: string = Array(match[0].length)
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

/**
 * Replaces scripts body with newline character
 * @param text the text to perform modifications
 * @returns the modified text
 */
export function deleteScripts(text: string): string {
    return text.replace(/\bscript\b([\s\S]+?)\bendscript\b/g, "script\nendscript");
}

/**
 * @returns true if the current line contains white spaces or nothing, false otherwise
 */
export function isEmpty(str: string): boolean {
    return /^\s*$/.test(str);
}

/**
 * Creates a diagnostic for a repeated setting. Warning if this setting was
 * multi-line previously, but now it is deprecated, error otherwise.
 * @param range The range where the diagnostic will be displayed
 * @param declaredAbove The setting, which has been declared earlier
 * @param current The current setting
 */
export function repetitionDiagnostic(range: Range, declaredAbove: Setting, current: Setting): Diagnostic {
    const diagnosticSeverity: DiagnosticSeverity =
        (["script", "thresholds", "colors"].includes(current.name)) ?
            DiagnosticSeverity.Warning : DiagnosticSeverity.Error;
    let message: string;
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

/**
 * Creates Range object.
 *
 * @param start - The starting position in the string
 * @param length - Length of the word to be highlighted
 * @param lineNumber - Number of line, where is the word to be highlighted
 * @returns Range object with start equal to `start` and end equal to `start+length` and line equal to `lineNumber`
 */
export function createRange(start: number, length: number, lineNumber: number) {
    return Range.create(
        Position.create(lineNumber, start),
        Position.create(lineNumber, start + length),
    );
}
