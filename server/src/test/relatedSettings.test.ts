import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("thresholds and colors tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct number of colors: \"thresholds\" declared before \"colors\"",
            `[widget]
               type = gauge
               thresholds = 0, 60, 80, 100
               colors = green, orange, red
               [group]`,
            [],
        ),
        new Test(
            "Correct number of colors: \"thresholds\" declared after \"colors\"",
            `[widget]
               type = gauge
               colors = green, orange, red
               thresholds = 0, 60, 80, 100
               [group]`,
            [],
        ),
        new Test(
            "Correct: colors declared as rgb",
            `[widget]
               type = gauge
               thresholds = 0, 10, 20, 30
               colors = rgb(247,251,255), rgb(222,235,247), rgb(198,219,239)
               [group]`,
            [],
        ),
        new Test(
            "Correct: \"colors\" declared without \"thresholds\" for bar",
            `[widget]
               type = bar
               timespan = 5 minute
               colors = darkorange, darkblue, darkred
               [group]`,
            [],
        ),
        new Test(
            "Correct: number of \"colors\" != number of \"thresholds\" - 1  for chart (\"thresholds\" have no effect)",
            `[widget]
               type = chart
               colors = green
               thresholds = 0, 60, 80, 100
               [group]`,
            [],
        ),
        new Test(
            "Correct: number of \"thresholds\" != number of \"colors\" - 1  for chart (\"thresholds\" have no effect)",
            `[widget]
               type = chart
               thresholds = 0, 60, 80, 100
               colors = green
               [group]`,
            [],
        ),
        new Test(
            "Incorrect number of colors: \"thresholds\" declared before \"colors\"",
            `[widget]
type = gauge
thresholds = 0, 40, 60, 80, 100
colors = green, orange, red
[group]`,
            [createDiagnostic(
                Range.create(Position.create(3, 0),
                    Position.create(3, "colors".length)),
                "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
                DiagnosticSeverity.Error,
            )],
        ),
        new Test(
            "Incorrect number of colors: \"thresholds\" declared after \"colors\"",
            `[widget]
type = calendar
colors = green, orange, red
thresholds = 0, 40, 60, 80, 100
[group]`,
            [createDiagnostic(
                Range.create(Position.create(2, 0),
                    Position.create(2, "colors".length)),
                "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
                DiagnosticSeverity.Error,
            )],
        ),
        new Test(
            "Incorrect: \"colors\" declared without \"thresholds\" for treemap",
            `[widget]
type = treemap
timespan = 5 minute
colors = darkorange, darkblue, darkred
[group]`,
            [createDiagnostic(
                Range.create(Position.create(3, 0), Position.create(3, "colors".length)),
                `thresholds are required if colors are specified`, DiagnosticSeverity.Error,
            )],
        )
    ];

    tests.forEach((test: Test) => { test.validationTest(); });
});

suite("color-range and gradient-count tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct: \"color-range\" declared before \"gradient-count\"",
            `[widget]
               type = calendar
               color-range = blue, silver
               gradient-count = 2`, []
        ),
        new Test(
            "Correct: \"color-range\" declared after \"gradient-count\"",
            `[widget]
               type = calendar
               gradient-count = 2
               color-range = blue, silver`, []
        ),
        new Test(
            "Incorrect: \"color-range\" is not declared",
            `[widget]
type = calendar
gradient-count = 2`, [createDiagnostic(
                Range.create(Position.create(2, 0),
                    Position.create(2, "gradient-count".length)),
                "color-range is required if gradient-count is specified",
            )]
        )
    ];
    tests.forEach((test: Test) => { test.validationTest(); });
});

suite("forecast-style and data-type tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct: data-type declared in [series]",
            `[widget]
            type = chart
            mode = column
            forecast-style = stroke: magenta;
            [series]
              entity = nurswgvml007
              metric = cpu_busy
              data-type = forecast`, []
        ),
        new Test(
            "Incorrect: data-type is not declared",
            `[widget]
type = chart
mode = column
forecast-style = stroke: magenta;`, [createDiagnostic(
                Range.create(Position.create(3, 0),
                    Position.create(3, "forecast-style".length)),
                "data-type is required if forecast-style is specified",
            )]
        )
    ];
    tests.forEach((test: Test) => { test.validationTest(); });
});

suite("alert-style and alert-expression tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct: alert-expression is declared",
            `[widget]
            type = chart
            alert-expression = value > 60
            alert-style = color: red`, []
        ),
        new Test(
            "Incorrect: alert-expression is not declared",
            `[widget]
            type = chart
alert-style = color: red`, [createDiagnostic(
                Range.create(Position.create(2, 0),
                    Position.create(2, "alert-style".length)),
                "alert-expression is required if alert-style is specified",
            )]
        )
    ];
    tests.forEach((test: Test) => { test.validationTest(); });
});