import { Util } from "language-service/dist";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { Test } from "./test";

suite("[JS] replace-value tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct function call",
            `replace-value = Math.log10(value)`,
            [],
        ),
        new Test(
            "Incorrect function call",
            `replace-value = Math.lg10(value)`,
            [Util.createDiagnostic(
                Range.create(Position.create(0, "replace-value = ".length),
                 Position.create(0, "replace-value = Math.lg10(value)".length)),
                "Math.lg10 is not a function", DiagnosticSeverity.Warning,
            )],
        )
    ];

    tests.forEach((test: Test) => { test.jsValidationTest(); });

});
