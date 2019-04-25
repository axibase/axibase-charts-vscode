import { Position, Range } from "vscode-languageserver";
import { CheckPriority } from "./checkPriority";

/**
 * Contains the text and the position of the text
 */
export class TextRange {
    /**
     * Matches a keyword
     */
    public static readonly KEYWORD_REGEXP: RegExp =
        /^([ \t]*)(import|endvar|endcsv|endfor|elseif|endif|endscript|endlist|script|else|if|list|for|csv|var)\b/i;

    /**
     * Checks is current keyword closeable or not (can be closed like var-endvar)
     * @param line the line containing the keyword
     * @returns true if the keyword closeable
     */
    public static isCloseAble(line: string): boolean {
        return /^[\s\t]*(?:for|if|list|var|script[\s\t]*$|csv|else|elseif)\b/.test(line);
    }

    /**
     * Checks does the keyword close a section or not
     * @param line the line containing the keyword
     * @returns true if the keyword closes a section
     */
    public static isClosing(line: string): boolean {
        return /^[ \t]*(?:end(?:for|if|list|var|script|csv)|elseif|else)\b/.test(line);
    }

    /**
     * Checks does the keyword increase the indent
     * @param line the line containing the keyword
     */
    public static isIncreasingIndent(line: string): boolean {
        return /^[ \t]*(?:for|if|else|elseif|script|csv|var|list)\b/.test(line);
    }

    /**
     * Checks is the keyword closeable or not.
     * @param line the line containing the keyword
     * @returns true if not closeable, false otherwise
     */
    public static isNotCloseAble(line: string): boolean {
        return /^[ \t]*else(?:if)?\b/.test(line);
    }

    /**
     * Parses a keyword from the line and creates a TextRange.
     * @param line the line containing the keyword
     * @param i the index of the line
     */
    public static parse(line: string, i: number, canBeSingle: boolean): TextRange | undefined {
        const match: RegExpExecArray | null = TextRange.KEYWORD_REGEXP.exec(line);
        if (match === null) {
            return undefined;
        }
        const [, indent, keyword] = match;

        return new TextRange(keyword, Range.create(
            Position.create(i, indent.length),
            Position.create(i, indent.length + keyword.length),
        ), CheckPriority.Low, canBeSingle);
    }

    /**
     * Priority of the text, used in jsDomCaller: settings with higher priority are placed earlier in test js "file"
     */
    public readonly priority: number = CheckPriority.Low;

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
    public readonly canBeUnclosed: boolean = false;

    public constructor(text: string, range: Range, priority?: number, canBeUnclosed?: boolean) {
        this.range = range;
        this.text = text;
        this.canBeUnclosed = canBeUnclosed;
        this.priority = priority;
    }
}
