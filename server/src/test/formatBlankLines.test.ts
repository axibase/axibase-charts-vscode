import { deepStrictEqual } from "assert";
import { FormattingOptions, Position, Range, TextEdit } from "vscode-languageserver";
import { Formatter } from "../formatter";

suite("Blank lines formatting", () => {
    test("Delete extra blank lines between sections", () => {
        const text = `[configuration]
  offset-right = 50


[group]`;
        const options: FormattingOptions = FormattingOptions.create(2, true);
        const expected: TextEdit[] = [
            TextEdit.replace(Range.create(
                Position.create(2, 0),
                Position.create(3, 0)),
                ""
            ),
            TextEdit.replace(Range.create(
                Position.create(3, 0),
                Position.create(4, 0)),
                ""
            ),
            TextEdit.replace(Range.create(
                Position.create(4, 0),
                Position.create(4, "[group]".length)),
                "\n[group]"
            )
        ];
        const formatter = new Formatter(text, options, true);

        const actual = formatter.lineByLine();
        deepStrictEqual(actual, expected);
    });
});
