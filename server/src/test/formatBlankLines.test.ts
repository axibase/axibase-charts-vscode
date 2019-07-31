import { deepStrictEqual } from "assert";
import { Position, Range, TextEdit } from "vscode-languageserver";
import { CustomFormattingOptions } from "../customFormattingOptions";
import { Formatter } from "../formatter";

suite("Blank lines formatting", () => {
    test("Delete extra blank lines between sections", () => {
        const text = `[configuration]
  offset-right = 50


[group]`;
        const options: CustomFormattingOptions = new CustomFormattingOptions(2, true, true);
        const expected: TextEdit[] = [
            TextEdit.replace(Range.create(
                Position.create(2, 0),
                Position.create(3, 0)),
                ""
            )
        ];
        const formatter = new Formatter(text, options);
        const actual = formatter.lineByLine();
        deepStrictEqual(actual, expected);
    });

    test("Insert blank line between sections", () => {
        const text = `[configuration]
  offset-right = 50
[group]`;
        const options: CustomFormattingOptions = new CustomFormattingOptions(2, true, true);
        const expected: TextEdit[] = [
            TextEdit.replace(Range.create(
                Position.create(2, 0),
                Position.create(2, "[group]".length)),
                "\n[group]"
            )
        ];
        const formatter = new Formatter(text, options);
        const actual = formatter.lineByLine();
        deepStrictEqual(actual, expected);
    });

    test("Correct config that doesn't need formatting", () => {
        const text = `[configuration]
  offset-right = 50

[group]`;
        const options: CustomFormattingOptions = new CustomFormattingOptions(2, true, true);
        const expected: TextEdit[] = [];
        const formatter = new Formatter(text, options);
        const actual = formatter.lineByLine();
        deepStrictEqual(actual, expected);
    });

    test("Delete blank line between settings", () => {
        const text = `[configuration]
  entity = nurswgvml007

  metric = cpu_busy
[group]`;
        const options: CustomFormattingOptions = new CustomFormattingOptions(2, true, true);
        const expected: TextEdit[] = [
            TextEdit.replace(Range.create(
                Position.create(2, 0),
                Position.create(3, 0)),
                ""
            ),
            TextEdit.replace(Range.create(
                Position.create(4, 0),
                Position.create(4, "[group]".length)),
                "\n[group]"
            )
        ];
        const formatter = new Formatter(text, options);
        const actual = formatter.lineByLine();
        deepStrictEqual(actual, expected);
    });
});
