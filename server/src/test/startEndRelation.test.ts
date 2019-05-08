import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

const sameSectionStartEnd = (
  startTime: string,
  endTime: string
) => {
  return `[configuration]
  [group]
  [widget]
    type = chart
    start-time = ${startTime}
    end-time = ${endTime}
    [series]
        entity = a
        metric = b`;
};

const differentSectionStartEnd = (
  startTime: string,
  endTime: string
) => {
  return `[configuration]
  entity = nurswgvml007
  metric = cpu_busy
  start-time = ${startTime}
[group]
  [widget]
    type = chart
    end-time = ${endTime}
    [series]
  [widget]
    type = chart
    end-time = 2018-07-05 13:00:00
    [series]`;
};

const differentSectionEndStart = (
  startTime: string,
  endTime: string
) => {
  return `[configuration]
  entity = nurswgvml007
  metric = cpu_busy
  end-time = ${endTime}
[group]
  [widget]
    type = chart
    start-time = ${startTime}
    [series]`;
};

const differentSectionForecast = (
  startTime: string,
  endTime: string
) => {
  return `[configuration]
  entity = nurswgvml007
  metric = cpu_busy
  end-time = ${startTime}
[group]
[widget]
  type = chart
  [series]
    forecast-horizon-end-time = ${endTime}`;
};

suite("Start-time and end-time comparison", () => {
    test("Start-time is greater than end-time. Both settings are in [widget]", () => {
        const config = sameSectionStartEnd("2017-04-22 01:00:00", "2015-04-22 01:00:00");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(5, 4), Position.create(5, 12)),
            "end-time must be greater than start-time",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic]);
    });

    test("Start-time and end-time relation is correct. Both settings are in [widget]", () => {
        const config = sameSectionStartEnd("2014-04-22 01:00:00", "2015-04-22 01:00:00");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, []);
    });

    test("Start-time and end-time relation is correct. Settings are in different sections", () => {
        const config = differentSectionStartEnd("2015-07-05 10:00:00", "2018-07-05 12:00:00");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, []);
    });

    test("End-time and start-time relation is correct. Settings are in different sections", () => {
      const config = differentSectionEndStart("2018-07-05 12:00:00", "2019-07-05 12:00:00");
      const validator = new Validator(config);
      const actualDiagnostics = validator.lineByLine();
      deepStrictEqual(actualDiagnostics, []);
    });

    test("End-time is less then start-time. Settings are in different sections", () => {
      const config = differentSectionEndStart("2019-07-05 12:00:00", "2018-07-05 12:00:00");
      const validator = new Validator(config);
      const actualDiagnostics = validator.lineByLine();
      const expectedDiagnostic = createDiagnostic(
        Range.create(Position.create(3, 2), Position.create(3, 10)),
        "end-time must be greater than start-time",
        DiagnosticSeverity.Error
      );
      deepStrictEqual(actualDiagnostics, [expectedDiagnostic]);
    });

    test("Start-time is greater than end-time. Settings are in different sections", () => {
        const config = differentSectionStartEnd("2019-07-05 10:00:00", "2018-07-05 12:00:00");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = [
            createDiagnostic(
                Range.create(Position.create(7, 4), Position.create(7, 12)),
                "end-time must be greater than start-time",
                DiagnosticSeverity.Error
            ),
            createDiagnostic(
                Range.create(Position.create(11, 4), Position.create(11, 12)),
                "end-time must be greater than start-time",
                DiagnosticSeverity.Error
            )];
        deepStrictEqual(actualDiagnostics, expectedDiagnostic);
    });

    test("Forecast-horizon-end-time and end-time relation is correct. Settings are in different sections", () => {
      const config = differentSectionForecast("2018-02-15T00:00:00Z", "2018-02-18T00:00:00Z");
      const validator = new Validator(config);
      const actualDiagnostics = validator.lineByLine();
      deepStrictEqual(actualDiagnostics, []);
    });

    test("End-time is greater than forecast-horizon-end-time. Settings are in different sections", () => {
      const config = differentSectionForecast("2020-02-15T00:00:00Z", "2018-02-18T00:00:00Z");
      const validator = new Validator(config);
      const actualDiagnostics = validator.lineByLine();
      const expectedDiagnostic = createDiagnostic(
        Range.create(Position.create(8, 4), Position.create(8, 29)),
        "forecast-horizon-end-time must be greater than end-time",
        DiagnosticSeverity.Error
      );
      deepStrictEqual(actualDiagnostics, [expectedDiagnostic]);
    });
});
