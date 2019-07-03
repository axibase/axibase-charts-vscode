import { Position, TextDocument } from "vscode-languageserver";
import { Test } from "./test";
import { CompletionProvider } from "../completionProvider";
import { strictEqual } from "assert";

suite("CompletionProvider tests", () => {
    [
        new Test(
            "Correct: completion using possibleValues",
            `type = `,
            ["chart", "gauge", "treemap", "bar", "calendar", "histogram", "box",
                "pie", "graph", "text", "page", "console", "table", "property"],
            undefined,
            Position.create(0, "type = ".length),
        ),
        new Test(
            "Correct: completion using example",
            `url = `,
            ["http://atsd_hostname:port"],
            undefined,
            Position.create(0, "url = ".length),
        ),
        new Test(
            "Correct: completion using example and script",
            `alert-style = `,
            ["stroke: red; stroke-width: 2", "alert"],
            undefined,
            Position.create(0, "alert-style = ".length),
        )
    ].forEach((test: Test): void => test.completionTest());
});

/**
 * Tests CompletionProvider for endkeywords, such as 'endif', 'endsql', etc
 */
suite("CompletionProvider endkeywords tests", () => {
    test("Endscript keyword completion", () => {
        const text = `script
        end`;
        const expected = "endscript";
        const position = Position.create(2, 1);
        const cp: CompletionProvider = new CompletionProvider(TextDocument.create("test", "axibasecharts", 1, text), position);
        const current: string[] = cp.getCompletionItems().map(i => i.insertText);
        strictEqual(current.includes(expected), true);
    });

    test("Start keyword misspelled, no completion", () => {
        const text = `sq
        end`;
        const expected = "endsql";
        const position = Position.create(2, 1);
        const cp: CompletionProvider = new CompletionProvider(TextDocument.create("test", "axibasecharts", 1, text), position);
        const current: string[] = cp.getCompletionItems().map(i => i.insertText);
        strictEqual(current.includes(expected), false);
    });

    test("Doesn't offer mismatched keyword completion", () => {
        const text = `sql
        end`;
        const expected = "endscript";
        const position = Position.create(2, 1);
        const cp: CompletionProvider = new CompletionProvider(TextDocument.create("test", "axibasecharts", 1, text), position);
        const current: string[] = cp.getCompletionItems().map(i => i.insertText);
        strictEqual(current.includes(expected), false);
    });
});