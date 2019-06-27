import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

const sameSectionAllSettings =
`[configuration]
  [group]
  [widget]
    type = chart
    start-time = 2017-04-22 01:00:00
    end-time = 2018-07-05 13:00:00
    timespan = 1 hour
    [series]
        entity = a
        metric = b`;

const differentSectionAllSettings =
`[configuration]
  type = chart
  start-time = 2017-04-22 01:00:00
[group]
[widget]
  end-time = 2018-07-05 13:00:00
  timespan = 1 hour
  [series]
      entity = a
      metric = b`;

const differentSectionSomeSettings =
`[configuration]
  type = chart
  start-time = 2017-04-22 01:00:00
[group]
[widget]
  timespan = 1 hour
  [series]
      entity = a
      metric = b`;

suite("Simultaneous start-time, end-time and timespan", () => {
    test("Start-time, end-time and timespan in same section", () => {
        const config = sameSectionAllSettings;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(4, 4), Position.create(4, 14)),
            `start-time, end-time and timespan mustn't be declared simultaneously. timespan will be ignored.`,
            DiagnosticSeverity.Warning
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });

    test("Start-time, end-time and timespan in different sections", () => {
        const config = differentSectionAllSettings;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(2, 2), Position.create(2, 12)),
            `start-time, end-time and timespan mustn't be declared simultaneously. timespan will be ignored.`,
            DiagnosticSeverity.Warning
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });

    test("Start-time and timespan in different sections. No end-time", () => {
      const config = differentSectionSomeSettings;
      const validator = new Validator(config);
      const actualDiagnostics = validator.lineByLine();
      deepStrictEqual(actualDiagnostics, [], `Config: \n${config}`);
    });
});
