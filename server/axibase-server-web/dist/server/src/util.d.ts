import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver-types";
import { Setting } from "./setting";
/**
 * @param value the value to find
 * @param map the map to search
 * @returns true if at least one value in map is/contains the wanted value
 */
export declare function isInMap<T>(value: T, map: Map<string, T[]> | Map<string, T[][]>): boolean;
/**
 * @param target array of aliases
 * @param array array to perform the search
 * @returns true, if array contains a value from target
 */
export declare function isAnyInArray<T>(target: T[], array: T[]): boolean;
/**
 * Clears the passed argument and looks for a setting with the same name
 * @param name name of the wanted setting
 * @param range TextRange of the setting in text.
 * @returns the wanted setting or undefined if not found
 */
export declare function getSetting(name: string, range?: Range): Setting | undefined;
/**
 * Counts CSV columns using RegExp.
 * @param line a CSV-formatted line
 * @returns number of CSV columns in the line
 */
export declare function countCsvColumns(line: string): number;
/**
 * Short-hand to create a diagnostic with undefined code and a standardized source
 * @param range Where is the mistake?
 * @param severity How severe is that problem?
 * @param message What message should be passed to the user?
 */
export declare function createDiagnostic(range: Range, message: string, severity?: DiagnosticSeverity): Diagnostic;
/**
 * Replaces all comments with spaces.
 * We need to remember places of statements in the original configuration,
 * that's why it is not possible to delete all comments, whereas they must be ignored.
 * @param text the text to replace comments
 * @returns the modified text
 */
export declare function deleteComments(text: string): string;
/**
 * Replaces scripts body with newline character
 * @param text the text to perform modifications
 * @returns the modified text
 */
export declare function deleteScripts(text: string): string;
/**
 * @returns true if the current line contains white spaces or nothing, false otherwise
 */
export declare function isEmpty(str: string): boolean;
/**
 * Creates a diagnostic for a repeated setting. Warning if this setting was
 * multi-line previously, but now it is deprecated, error otherwise.
 * @param range The range where the diagnostic will be displayed
 * @param declaredAbove The setting, which has been declared earlier
 * @param current The current setting
 */
export declare function repetitionDiagnostic(range: Range, declaredAbove: Setting, current: Setting): Diagnostic;
/**
 * Creates Range object.
 *
 * @param start - The starting position in the string
 * @param length - Length of the word to be highlighted
 * @param lineNumber - Number of line, where is the word to be highlighted
 * @returns Range object with start equal to `start` and end equal to `start+length` and line equal to `lineNumber`
 */
export declare function createRange(start: number, length: number, lineNumber: number): Range;
