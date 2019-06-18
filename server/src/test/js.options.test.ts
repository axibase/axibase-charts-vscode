import { Util } from "language-service/dist";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { Test } from "./test";

suite("[JS] options tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct function call",
            `options = javascript: requestMetricsSeriesOptions()`,
            [],
        ),
        new Test(
            "Incorrect function call",
            `options = javascript: MetricsSeriesOptions()`,
            [Util.createDiagnostic(
                Range.create(Position.create(0, "options = javascript: ".length),
                    Position.create(0, "options = javascript: MetricsSeriesOptions()".length)),
                "MetricsSeriesOptions is not defined", DiagnosticSeverity.Warning,
            )],
        )
    ];

    tests.forEach((test: Test) => { test.jsValidationTest(); });

});
