import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("Thresholds and colors tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct number of colors: \"thresholds\" declared before \"colors\"",
            `[widget]
               type = gauge
               thresholds = 0, 60, 80, 100
               colors = green, orange, red`,
            [],
        ),
        new Test(
            "Correct number of colors: \"thresholds\" declared after \"colors\"",
            `[widget]
               type = gauge
               colors = green, orange, red
               thresholds = 0, 60, 80, 100`,
            [],
        ),
        new Test(
            "Correct: \"colors\" declared without \"thresholds\" for bar",
            `[widget]
               type = bar
               timespan = 5 minute
               colors = darkorange, darkblue, darkred`,
            [],
        ),
        new Test(
            "Correct: number of \"colors\" != number of \"thresholds\" - 1  for chart (\"thresholds\" have no effect)",
            `[widget]
               type = chart
               colors = green
               thresholds = 0, 60, 80, 100`,
            [],
        ),
        new Test(
            "Correct: number of \"thresholds\" != number of \"colors\" - 1  for chart (\"thresholds\" have no effect)",
            `[widget]
               type = chart
               thresholds = 0, 60, 80, 100
               colors = green`,
            [],
        ),
        new Test(
            "Incorrect number of colors: \"thresholds\" declared before \"colors\"",
            `[widget]
type = gauge
thresholds = 0, 40, 60, 80, 100
colors = green, orange, red`,
            [createDiagnostic(
                Range.create(Position.create(3, "colors = ".length),
                    Position.create(3, "colors = green, orange, red".length)),
                "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
                DiagnosticSeverity.Error,
            )],
        ),
        new Test(
            "Incorrect number of colors: \"thresholds\" declared after \"colors\"",
            `[widget]
type = calendar
colors = green, orange, red
thresholds = 0, 40, 60, 80, 100`,
            [createDiagnostic(
                Range.create(Position.create(3, "thresholds = ".length),
                    Position.create(3, "thresholds = 0, 40, 60, 80, 100".length)),
                "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
                DiagnosticSeverity.Error,
            )],
        ),
        new Test(
            "Incorrect: \"colors\" declared without \"thresholds\" for treemap",
            `[widget]
type = treemap
timespan = 5 minute
colors = darkorange, darkblue, darkred`,
            [createDiagnostic(
                Range.create(Position.create(3, 0), Position.create(3, "colors".length)),
                `"thresholds" are required if "colors" are specified`, DiagnosticSeverity.Error,
            )],
        )
    ];

    tests.forEach((test: Test) => { test.validationTest(); });
});
