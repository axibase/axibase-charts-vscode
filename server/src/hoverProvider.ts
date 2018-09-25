import { Hover, Position, Range, TextDocument } from "vscode-languageserver";
import { Setting } from "./setting";
import { getSetting } from "./util";

interface IRange {
    start: number;
    end: number;
}

/**
 * Provides hints for settings
 */
export class HoverProvider {
    /**
     * TextDocument content
     */
    private readonly text: string;
    /**
     * The target TextDocument
     */
    private readonly document: TextDocument;

    public constructor(document: TextDocument) {
        this.text = document.getText();
        this.document = document;
    }

    /**
     * Provides hover for the required position
     * @param position position where hover is requested
     */
    public provideHover(position: Position): Hover | null {
        const range: IRange = this.calculateRange(this.positionToOffset(position));
        if (range === null) {
            return null;
        }
        const word: string = this.text.substring(range.start, range.end);
        const name: string = Setting.clearSetting(word);
        const setting: Setting | undefined = getSetting(name);
        if (setting == null) {
            return null;
        }

        return {
            contents: setting.description,
            range: Range.create(this.offsetToPosition(range.start), this.offsetToPosition(range.end)),
        };
    }

    /**
     * Converts Position to offset
     * @param position the Position to be converted
     */
    private positionToOffset(position: Position): number {
        return this.document.offsetAt(position);
    }

    /**
     * Converts offset to Position
     * @param offset the offset to be converted
     */
    private offsetToPosition(offset: number): Position {
        return this.document.positionAt(offset);
    }

    /**
     * Calculates the range where the setting is defined
     * @param offset offset from which to start
     */
    private calculateRange(offset: number): IRange | null {
        const regexp: RegExp = /\S.+?(?=\s+?=)/;
        let start: number = this.text.lastIndexOf("\n", offset);
        if (start < 0) {
            return null;
        }
        const match: RegExpExecArray | null = regexp.exec(this.text.substring(start));
        if (match === null) {
            return null;
        }
        start += match.index;

        return {
            end: start + match[0].length,
            start,
        };
    }
}
