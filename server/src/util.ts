import * as Levenshtein from "levenshtein";
import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { calendarRegExp, localDateRegExp, settingsMap, zonedDateRegExp } from "./resources";
import { Setting } from "./setting";

const DIAGNOSTIC_SOURCE: string = "Axibase Charts";

/**
 * @param value the value to find
 * @param map the map to search
 * @returns true if at least one value in map is/contains the wanted value
 */
export const isInMap: <T>(value: T, map: Map<string, T[]> | Map<string, T[][]>) => boolean =
    <T>(value: T, map: Map<string, T[]> | Map<string, T[][]>): boolean => {
        if (!value || !map) {
            return false;
        }
        for (const array of map.values()) {
            for (const item of array) {
                if (Array.isArray(item)) {
                    if (item.includes(value)) {
                        return true;
                    }
                } else {
                    if (item === value) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

/**
 * @param target array of aliases
 * @param array array to perform the search
 * @returns true, if array contains a value from target
 */
export const isAnyInArray: <T>(target: T[], array: T[]) => boolean = <T>(target: T[], array: T[]): boolean => {
    if (!array) {
        return false;
    }
    for (const item of target) {
        if (array.includes(item)) {
            return true;
        }
    }

    return false;
};

/**
 * @param map the map being transformed
 * @returns array containing all values from values of map
 */
export const mapToArray: (map: Map<string, string[]>) => string[] = (map: Map<string, string[]>): string[] => {
    let array: string[] = [];
    for (const item of map.values()) {
        array = array.concat(item);
    }

    return array;
};

/**
 * Looks for a closest item (lowest Levenshtein distance) in the dictionary to the word
 * @param word the word to perform search
 * @param dictionary the dictionary to perform search
 * @returns message containing a suggestion if found one
 */
export const suggestionMessage: (word: string, dictionary?: Iterable<string>) => string =
    (word: string, dictionary?: Iterable<string>): string => {
        if (!dictionary) {
            return errorMessage(word);
        }
        let suggestion: string | undefined;
        let min: number = Number.MAX_VALUE;
        for (const value of dictionary) {
            if (value) {
                const distance: number = new Levenshtein(value, word).distance;
                if (distance < min) {
                    min = distance;
                    suggestion = value;
                }
            }
        }

        return errorMessage(word, suggestion);
    };

/**
 * @param name name of the wanted setting
 * @returns the wanted setting or undefined if not found
 */
export const getSetting: (name: string) => Setting | undefined = (name: string): Setting | undefined => {
    const clearedName: string = Setting.clearSetting(name);

    return settingsMap.get(clearedName);
};

/**
 * @param line a CSV-formatted line
 * @returns number of CSV columns in the line
 */
export const countCsvColumns: (line?: string) => number = (line?: string): number => {
    if (!line) {
        return 0;
    }
    const regex: RegExp = /(['"]).+\1|[^, \t]+/g;
    let counter: number = 0;
    while (regex.exec(line)) {
        counter++;
    }

    return counter;
};

/**
 * Short-hand to create a diagnostic with undefined code and a standardized source
 * @param range Where is the mistake?
 * @param severity How severe is that problem?
 * @param message What message should be passed to the user?
 */
export const createDiagnostic: (range: Range, severity: DiagnosticSeverity, message: string) => Diagnostic =
    (range: Range, severity: DiagnosticSeverity, message: string): Diagnostic =>
        Diagnostic.create(range, message, severity, undefined, DIAGNOSTIC_SOURCE);

/**
 * Replaces all comments with spaces
 * @param text the text to replace comments
 * @returns the modified text
 */
export const deleteComments: (text: string) => string = (text: string): string => {
    let content: string = text;
    const multiLine: RegExp = /\/\*[\s\S]*?\*\//g;
    const oneLine: RegExp = /^[ \t]*#.*/mg;
    let match: RegExpExecArray | null = multiLine.exec(content);
    if (!match) {
        match = oneLine.exec(content);
    }

    while (match) {
        const newLines: number = match[0].split("\n").length - 1;
        const spaces: string = Array(match[0].length)
            .fill(" ")
            .concat(
                Array(newLines)
                    .fill("\n"),
            )
            .join("");
        content = `${content.substr(0, match.index)}${spaces}${content.substr(match.index + match[0].length)}`;
        match = multiLine.exec(content);
        if (!match) {
            match = oneLine.exec(content);
        }
    }

    return content;
};

/**
 * Creates a error message containing a suggestion for misspelled setting (or without suggestion if none is available)
 * @param found the variant found in the user's text
 * @param suggestion the variant which is present in memory
 * @returns message with or without a suggestion
 */
export const errorMessage: (found: string, suggestion?: string) => string =
    (found: string, suggestion?: string): string =>
        (suggestion) ? `${found} is unknown. Suggestion: ${suggestion}` : `${found} is unknown.`;

/**
 * Replaces scripts body with newline character
 * @param text the text to perform modifications
 * @returns the modified text
 */
export const deleteScripts: (text: string) => string = (text: string): string =>
    text.replace(/\bscript\b([\s\S]+?)\bendscript\b/g, "script\nendscript");

/**
 * Tests the provided string with regular expressions
 * @param text the target string
 * @returns true if the string is date expression, false otherwise
 */
export const isDate: (text: string) => boolean = (text: string): boolean =>
    calendarRegExp.test(text) || localDateRegExp.test(text) || zonedDateRegExp.test(text);

/**
 * Adds to the array display names of all present settings
 * @param array the target array
 * @returns array containing both source array content and display names
 */
export const addDisplayNames: (array?: string[]) => string[] = (array?: string[]): string[] => {
    const result: string[] = (array) ? array : [];
    for (const item of settingsMap.values()) {
        result.push(item.displayName);
    }

    return result;
};

/**
 * @returns true if the current line contains white spaces or nothing, false otherwise
 */
export const isEmpty: (str: string) => boolean = (str: string): boolean => /^\s*$/.test(str);
