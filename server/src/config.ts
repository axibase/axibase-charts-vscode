import { deleteComments } from "./util";

/**
 * Stores config lines as array, removes comments.
 */
/// <amd-module name="Config"/>
export class Config {
    public currentLineNumber: number = -1;
    private currentLine: string;
    private lines: string[];

    public constructor(text: string) {
        this.lines = deleteComments(text)
            .toLowerCase()
            .split("\n");
    }

    public getCurrentLine(): string {
        return this.currentLine;
    }

    /**
     * Returns lowercased config line with specified index.
     *
     * @param line - Index of line to be returned
     * @returns Lowercased line of config with index equal to `line`
     */
    public getLine(line: number): string | null {
        return (line < this.lines.length && line >= 0) ? this.lines[line] : null;
    }

    public *[Symbol.iterator]() {
        for (let line of this.lines) {
            this.currentLine = line;
            this.currentLineNumber++;
            yield line;
        }
    }
}
