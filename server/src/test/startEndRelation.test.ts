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

    test("Forecast-horizon-end-time and end-time relation is correct. Settings are in different sections", () => {
      const config = `[configuration]
      offset-right = 50
      height-units = 3
      width-units = 1
      timezone = utc
      entity = nurswgvml007
      metric = cpu_busy
      step-line = false
      timespan = 1 week
      end-time = 2018-02-15T00:00:00Z
      period = 1 hour
      statistics = avg
      interpolate = LINEAR
      label-format = forecast
    [group]
      widgets-per-row = 1
    [widget]
      type = chart
      [series]
        forecast-ssa = true
        forecast-horizon-end-time = 2018-02-18T00:00:00Z
        forecast-include = HISTORY, FORECAST
    [widget]
      type = chart
      [series]
        forecast-ssa = true
        forecast-horizon-interval = 1 day
        forecast-include = HISTORY, FORECAST`;

      const validator = new Validator(config);
      const actualDiagnostics = validator.lineByLine();
      deepStrictEqual(actualDiagnostics, []);
    });

    test("End-time is greater than forecast-horizon-end-time. Settings are in different sections", () => {
      const config = `[configuration]
      offset-right = 50
      height-units = 3
      width-units = 1
      timezone = utc
      entity = nurswgvml007
      metric = cpu_busy
      step-line = false
      timespan = 1 week
      end-time = 2020-02-15T00:00:00Z
      period = 1 hour
      statistics = avg
      interpolate = LINEAR
      label-format = forecast
    [group]
      widgets-per-row = 1
    [widget]
      type = chart
      [series]
        forecast-ssa = true
        forecast-horizon-end-time = 2018-02-18T00:00:00Z
        forecast-include = HISTORY, FORECAST
    [widget]
      type = chart
      [series]
        forecast-ssa = true
        forecast-horizon-interval = 1 day
        forecast-include = HISTORY, FORECAST`;

      const validator = new Validator(config);
      const actualDiagnostics = validator.lineByLine();
      const expectedDiagnostic = createDiagnostic(
        Range.create(Position.create(20, 8), Position.create(20, 33)),
        "forecast-horizon-end-time must be greater than end-time",
        DiagnosticSeverity.Error
      );
      deepStrictEqual(actualDiagnostics, [expectedDiagnostic]);
    });
});
