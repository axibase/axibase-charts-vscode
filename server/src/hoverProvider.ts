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

    public provideHover(position: Position): Hover {
        const range: IRange = this.calculateRange(this.positionToOffset(position));
        const word: string = this.text.substring(range.start, range.end);
        const name: string = Setting.clearSetting(word);
        const setting: Setting | undefined = getSetting(name);
        if (setting != null) {
            return {
                contents: setting.description,
                range: Range.create(this.offsetToPosition(range.start), this.offsetToPosition(range.end)),
            };
        } else {
            return null;
        }
    }

    private positionToOffset(position: Position): number {
        return this.document.offsetAt(position);
    }

    private offsetToPosition(offset: number): Position {
        return this.document.positionAt(offset);
    }

    private calculateRange(offset: number): IRange {
        let start: number = offset;
        let end: number = offset;
        while (this.text.charAt(start) !== "\n" && start >= 0) {
            start--;
        }
        while (this.text.charAt(end) !== "=" && end < this.text.length - 1) {
            end++;
        }

        return { start, end };
    }
}
