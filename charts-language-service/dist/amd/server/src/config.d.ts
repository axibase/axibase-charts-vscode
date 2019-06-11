/**
 * Stores config lines as array, removes comments.
 */
export declare class Config {
    currentLineNumber: number;
    private currentLine;
    private lines;
    constructor(text: string);
    getCurrentLine(): string;
    /**
     * Returns lowercased config line with specified index.
     *
     * @param line - Index of line to be returned
     * @returns Lowercased line of config with index equal to `line`
     */
    getLine(line: number): string | null;
    [Symbol.iterator](): IterableIterator<string>;
}
