import { Position, Range, DiagnosticSeverity } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("Thresholds and colors tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct number of colors: \"thresholds\" declared before \"colors\"",
            `thresholds = 0, 60, 80, 100
            colors = green, orange, red`,
            [],
        ),
        new Test(
            "Correct number of colors: \"thresholds\" declared after \"colors\"",
            `colors = green, orange, red
            thresholds = 0, 60, 80, 100`,
            [],
        ),
        new Test(
            "Incorrect number of colors: \"thresholds\" declared before \"colors\"",
            `thresholds = 0, 40, 60, 80, 100
colors = green, orange, red`,
            [createDiagnostic(
                Range.create(Position.create(1, "colors = ".length), Position.create(1, "colors = green, orange, red".length)),
                "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.", DiagnosticSeverity.Error,
            )],
        ),
        new Test(
            "Incorrect number of colors: \"thresholds\" declared after \"colors\"",
            `colors = green, orange, red
thresholds = 0, 40, 60, 80, 100`,
            [createDiagnostic(
                Range.create(Position.create(1, "thresholds = ".length), Position.create(1, "thresholds = 0, 40, 60, 80, 100".length)),
                "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.", DiagnosticSeverity.Error,
            )],
        ),
        new Test(
            "\"colors\" declared without \"thresholds\"",
            `colors = green, orange, red`,
            [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "colors".length)),
                `"thresholds" are required if "colors" are specified`, DiagnosticSeverity.Error,
            )],
        )
    ];

    tests.forEach((test: Test) => { test.validationTest(); });
});