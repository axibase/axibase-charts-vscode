import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

suite("Start-time and end-time comparison", () => {
    test("Start-time is greater than end-time. Both settings are in [widget]", () => {
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

    test("Start-time and end-time relation is correct. Both settings are in [widget]", () => {
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

    test("Start-time and end-time relation is correct. Settings are in different sections", () => {
        const config = `[configuration]
        entity = nurswgvml007
        metric = cpu_busy
        start-time = 2015-07-05 10:00:00
      [group]
        [widget]
          type = chart
          end-time = 2018-07-05 12:00:00
          [series]
        [widget]
          type = chart
          end-time = 2018-07-05 13:00:00
          [series]`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, []);
    });

    test("Start-time is greater than end-time. Settings are in different sections", () => {
        const config = `[configuration]
        entity = nurswgvml007
        metric = cpu_busy
        start-time = 2019-07-05 10:00:00
      [group]
        [widget]
          type = chart
          end-time = 2018-07-05 12:00:00
          [series]
        [widget]
          type = chart
          end-time = 2018-07-05 13:00:00
          [series]`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = [
            createDiagnostic(
                Range.create(Position.create(7, 10), Position.create(7, 18)),
                "end-time must be greater than start-time",
                DiagnosticSeverity.Error
            ),
            createDiagnostic(
                Range.create(Position.create(11, 10), Position.create(11, 18)),
                "end-time must be greater than start-time",
                DiagnosticSeverity.Error
            )];
        deepStrictEqual(actualDiagnostics, expectedDiagnostic);
    });
});
