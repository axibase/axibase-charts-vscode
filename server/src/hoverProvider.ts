import { Hover, Position, Range, TextDocument } from "vscode-languageserver";
import { Setting } from "./setting";
import { getSetting } from "./util";

interface IRange {
    start: number;
    end: number;
}

/**
 * Generates a description for the provided setting
 * @param setting the setting to be described
 */
function hoverContent(setting: Setting): string {
    // TODO: describe a script which is allowed as the setting value
    // TODO: describe a widget where the setting is allowed
    return `${setting.description}
${setting.example == null || setting.example === "" ? "" : `Example: ${setting.displayName} = ${setting.example}  `}
${setting.type == null || setting.type === "" ? "" : `Type: ${setting.type}  `}
${setting.defaultValue == null || setting.defaultValue === "" ? "" : `Default value: ${setting.defaultValue}  `}
${setting.enum == null || setting.enum.length === 0 ? "" : `Possible values: ${setting.enum}  `}
${setting.excludes == null || setting.excludes.length === 0 ? "" : `Can not be specified with: ${setting.excludes}  `}
${setting.maxValue == null || setting.maxValue === Infinity ? "" : `Maximum: ${setting.maxValue}  `}
${setting.minValue == null || setting.minValue === -Infinity ? "" : `Minimum: ${setting.minValue}  `}
${setting.section == null || setting.section === "" ? "" : `Allowed in section: ${setting.section}  `}`;
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
        if (setting == null || setting.description == null) {
            return null;
        }

        return {
            contents: hoverContent(setting),
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
     * Finds limits of a line in text
     * @param position position from which to start
     */
    private lineLimits(position: Position): IRange {
        return {
            end: this.positionToOffset(Position.create(position.line + 1, 0)) - 1,
            start: this.positionToOffset(Position.create(position.line, 0)),
        };
    }

    /**
     * Calculates the range where the setting is defined
     * @param offset offset from which to start
     */
    private calculateRange(offset: number): IRange | null {
        const lineLimits: IRange = this.lineLimits(this.offsetToPosition(offset));
        const line: string = this.text.substring(lineLimits.start, lineLimits.end);
        const regexp: RegExp = /\S.+?(?=\s*?=)/;
        const match: RegExpExecArray | null = regexp.exec(line);
        if (match === null) {
            return null;
        }
        const start: number = lineLimits.start + match.index;
        const end: number = start + match[0].length;
        if (offset >= start && offset <= end) {
            return { end, start };
        }

        return null;
    }
}
