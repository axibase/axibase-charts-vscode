import { Hover, Position, Range, TextDocument } from "vscode-languageserver";
import { Setting } from "./setting";
import { getSetting } from "./util";

interface IRange {
    start: number;
    end: number;
}

export class HoverProvider {
    private readonly text: string;
    private readonly document: TextDocument;

    public constructor(document: TextDocument) {
        this.text = document.getText();
        this.document = document;
    }

    public provideHover(position: Position): Hover | null {
        const range: IRange = this.calculateRange(this.positionToOffset(position));
        if (range === null) {
            return null;
        }
        const word: string = this.text.substring(range.start, range.end);
        console.log(`Word is ${word}`);
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

    private positionToOffset(position: Position): number {
        return this.document.offsetAt(position);
    }

    private offsetToPosition(offset: number): Position {
        return this.document.positionAt(offset);
    }

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
