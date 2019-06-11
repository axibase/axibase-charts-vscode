import { Range } from "vscode-languageserver-types";
import { CheckPriority } from "./checkPriority";
import { createRange } from "./util";

/**
 * Contains the text and the position of the text
 */
/// <amd-module name="TextRange"/>
export class TextRange {
    /**
     * Matches a keyword
     */
    public static readonly KEYWORD_REGEXP: RegExp =
        // tslint:disable-next-line: max-line-length
        /^([ \t]*)(import|endvar|endcsv|endfor|elseif|endif|endscript|endlist|endsql|script|else|if|list|sql|for|csv|var)\b/i;

    /**
     * Checks is current keyword closeable or not (can be closed like var-endvar)
     * @param line the line containing the keyword
     * @returns true if the keyword closeable
     */
    public static isCloseAble(line: string): boolean {
        return /^[\s\t]*(?:for|if|list|sql|var|script[\s\t]*$|csv|else|elseif)\b/.test(line);
    }

    /**
     * Checks does the keyword close a section or not
     * @param line the line containing the keyword
     * @returns true if the keyword closes a section
     */
    public static isClosing(line: string): boolean {
        return /^[\s\t]*(?:end(?:for|if|list|var|script|sql|csv)|elseif|else)\b/.test(line);
    }

    /**
     * Parses a keyword from the line and creates a TextRange.
     * @param line the line containing the keyword
     * @param i the index of the line
     * @param canBeUnclosed whether keyword can exist in both closed and unclosed variant or not
     */
    public static parse(line: string, i: number, canBeUnclosed: boolean): TextRange | undefined {
        const match: RegExpExecArray | null = TextRange.KEYWORD_REGEXP.exec(line);
        if (match === null) {
            return undefined;
        }
        const [, indent, keyword] = match;

        return new TextRange(keyword, createRange(indent.length, keyword.length, i), canBeUnclosed);
    }

    /**
     * Priority of the text, used in jsDomCaller: settings with higher priority are placed earlier in test js "file"
     */
    public priority: number = CheckPriority.Low;

    /**
     * priority property setter
     */
    set textPriority(value: number) {
        this.priority = value;
    }

    /**
     * Position of the text
     */
    public readonly range: Range;

    /**
     * Text at this position
     */
    public readonly text: string;

    /**
     * Keyword can exist in both closed and unclosed variants
     */
    public readonly canBeUnclosed: boolean;

    public constructor(text: string, range: Range, canBeUnclosed: boolean = false) {
        this.range = range;
        this.text = text;
        this.canBeUnclosed = canBeUnclosed;
    }
}
