export class CustomFormattingOptions {
    public tabSize: number;
    public insertSpaces: boolean;
    public formatBlankLines?: boolean;
    [key: string]: boolean | number | string;

    constructor(tabSize: number, insertSpaces: boolean, formatBlankLines: boolean = false) {
        this.tabSize = tabSize;
        this.insertSpaces = insertSpaces;
        this.formatBlankLines = formatBlankLines;
    }
}
