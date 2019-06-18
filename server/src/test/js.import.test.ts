import { Util } from "language-service/dist";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { Test } from "./test";

suite("[JS] import tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct import reference",
            `import fred = fred.js
            value = fred.MonthlyChange('base')`,
            [],
        ),
        new Test(
            "Incorrect import reference",
            `import fred = fred.js
value = red.MonthlyChange('base')`,
            [Util.createDiagnostic(
                Range.create(Position.create(1, "value = ".length),
                    Position.create(1, "value = red.MonthlyChange('base')".length)),
                "red is not defined", DiagnosticSeverity.Warning,
            )],
        )
    ];

    tests.forEach((test: Test) => { test.jsValidationTest(); });
});
