import { Range } from "vscode-languageserver";
/**
 * Contains the text and the position of the text
 */
export declare class TextRange {
    /**
     * Matches a keyword
     */
    static readonly KEYWORD_REGEXP: RegExp;
    /**
     * Checks is current keyword closeable or not (can be closed like var-endvar)
     * @param line the line containing the keyword
     * @returns true if the keyword closeable
     */
    static isCloseAble(line: string): boolean;
    /**
     * Checks does the keyword close a section or not
     * @param line the line containing the keyword
     * @returns true if the keyword closes a section
     */
    static isClosing(line: string): boolean;
    /**
     * Parses a keyword from the line and creates a TextRange.
     * @param line the line containing the keyword
     * @param i the index of the line
     * @param canBeUnclosed whether keyword can exist in both closed and unclosed variant or not
     */
    static parse(line: string, i: number, canBeUnclosed: boolean): TextRange | undefined;
    /**
     * Priority of the text, used in jsDomCaller: settings with higher priority are placed earlier in test js "file"
     */
    priority: number;
    /**
     * priority property setter
     */
    textPriority: number;
    /**
     * Position of the text
     */
    readonly range: Range;
    /**
     * Text at this position
     */
    readonly text: string;
    /**
     * Keyword can exist in both closed and unclosed variants
     */
    readonly canBeUnclosed: boolean;
    constructor(text: string, range: Range, canBeUnclosed?: boolean);
}
