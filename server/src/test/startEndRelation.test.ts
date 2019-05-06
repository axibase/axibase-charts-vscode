import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

suite("Start-time and end-time comparison", () => {
    test("Throws error that start-time is greater then end-time", () => {
        const config = `[configuration]
        [group]
        [widget]
          type = chart
          start-time = 2017-04-22 01:00:00
          end-time = 2015-04-22 01:00:00
          [series]
              entity = a
              metric = b`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(5, 10), Position.create(5, 18)),
            "end-time must be greater than start-time",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic]);
    });

    test("Doesn't throw error if start-time and end-time relation is correct", () => {
        const config = `[configuration]
        [group]
        [widget]
          type = chart
          start-time = 2014-04-22 01:00:00
          end-time = 2015-04-22 01:00:00
          [series]
              entity = a
              metric = b`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, []);
    });
});
