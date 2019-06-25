import { Range } from "vscode-languageserver";
import { CheckPriority } from "./checkPriority";
import { createRange } from "./util";

/**
 * Contains the text and the position of the text
 */
export class TextRange {
    /**
     * Matches a keyword
     */
    public static readonly KEYWORD_REGEXP: RegExp =
        // tslint:disable-next-line: max-line-length
        /^([ \t]*)(import|endvar|endcsv|endfor|elseif|endif|endscript|endlist|endsql|script|else|if|list|sql|for|csv|var)\b/i;

    /**
     * Regexps for keywords supporting both closed and unclosed syntax
     */
    public static readonly CAN_BE_UNCLOSED_REGEXP: RegExp[] = [
        // 'csv <name> from <url>'
        /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(from)/m
    ];

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
     * Determines if line contains a keyword that can be unclosed
     * @param line the line containing the keyword
     */
    public static canBeUnclosed(line: string): boolean {
        let match: RegExpExecArray | null = null;

        TextRange.CAN_BE_UNCLOSED_REGEXP.forEach(regexp => {
            match = regexp.exec(line);
        });

        return (match !== null) ? true : false;
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
