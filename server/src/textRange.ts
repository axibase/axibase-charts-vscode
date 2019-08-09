import { Range } from "vscode-languageserver";
import { CheckPriority } from "./checkPriority";

/**
 * Contains the text and the position of the text
 */
export class TextRange {
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
