import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

suite("Warn about deprecated setting", () => {
    test("Shows warning message for deprecated setting in relevant widget type", () => {
        const config = `[configuration]
            [group]
            [widget]
                type = chart
                stack = false
                metric = a
                [column]
                    [series]
                    entity = b`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(4, 16), Position.create(4, 21)),
            "This setting is deprecated in timechart. Use `mode = stack` instead",
            DiagnosticSeverity.Warning
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic]);
    });

    test("Doesn't show warning message for deprecated setting in irrelevant widget type", () => {
        const config = `[configuration]
            [group]
            [widget]
                type = bar
                stack = false
                metric = a
                [column]
                    [series]
                    entity = b`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, []);
    });
});
