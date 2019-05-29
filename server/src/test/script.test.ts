import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { lineFeedRequired } from "../messageUtil";
import { createDiagnostic } from "../util";
import { Test } from "./test";

const unknownToken: string = "script has no matching endscript";

suite("Script endscript tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct empty script",
            `script
endscript`,
            [],
        ),
        new Test(
            "Unclosed empty script",
            `script
endscrpt`,
            [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "script".length)),
                unknownToken,
            )],
        ),
        new Test(
            "Script with unclosed for",
            `script
	for (let i = 0, i < 5, i+) {}
endscript`,
            [],
        ),
        new Test(
            "Two correct scripts",
            `script
	for (let i = 0, i < 5, i+) {}
endscript
script
	for (let i = 0, i < 5, i+) {}
endscript`,
            [],
        ),
        new Test(
            "Two unclosed scripts",
            `script
endscrpt
script
endscrpt`,
            [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "script".length)),
                unknownToken,
            )],
        ),
        new Test(
            "Correct one-line script = ",
            "script = if (!config.isDialog) c = widget",
            [],
        ),
        new Test(
            "Correct one-line script = and a setting after",
            `[widget]
script = if (!config.isDialog) c = widget
type = chart`,
            [],
        ),
        new Test(
            "Correct multi-line script = ",
            `script = if
script =		(!config.isDialog)
script =			c = widget`,
            [

                createDiagnostic(
                    Range.create(1, 0, 1, "script".length),
                    "Multi-line scripts are deprecated.\nGroup multiple scripts into blocks:\nscript\nendscript",
                    DiagnosticSeverity.Warning,
                ),
                createDiagnostic(
                    Range.create(2, 0, 2, "script".length),
                    "Multi-line scripts are deprecated.\nGroup multiple scripts into blocks:\nscript\nendscript",
                    DiagnosticSeverity.Warning,
                ),
            ],
        ),
        new Test(
            "Incorrect empty one-line script = ",
            "script = ",
            [createDiagnostic(Range.create(0, 0, 0, "script".length), `script can not be empty`)],
        ),
        new Test(
            "Correct one-line script = with endscript ",
            `script = if (!config.isDialog) c = widget
endscript`,
            [createDiagnostic(
                Range.create(1, 0, 1, "endscript".length),
                "endscript has no matching script",
            )],
        ),
        new Test(
            "Incorrect script/endscript declaration",
            `script alert("Hello, world!")
endscript`,
            [createDiagnostic(
                Range.create(0, 0, 0, "script".length), lineFeedRequired("script")
            )],
        ),
        new Test(
            "Handle '\\r' character properly",
            "script = if (!config.isDialog) c = widget\r\n",
            [],
        ),
        new Test(
            "Script content must be ignored",
            `[widget]
  type = chart
  script
    stylesheet.innerHTML = "text"
  endscript`,
            [],
        ),
    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
