import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

const INLINE_IF_WARNING = `Specify == or !=`;
const VAR_NAMES_DONT_MATCH = (nameInCondition: string) =>
    `var '${nameInCondition}' used in 'if' condition not found`;

const testConfig = (condition: string, variable?: string) =>
    `[configuration]
[group]
  [widget]
    type = chart
    [series]
      entity = a
      metric = b
      ${variable}
      if ${condition}
      endif`;

suite("If condition syntax tests", () => {
    test("Correct inline if condition", () => {
        const config = testConfig("b == 2");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, [], `Config: \n${config}`);
    });

    test("Incorrect inline if condition, missing `==` or `!=`", () => {
        const config = testConfig("b");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(8, 6), Position.create(8, 8)),
            INLINE_IF_WARNING,
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });

    test("Correct if condition via variable declaration", () => {
        const config = testConfig("b", "var b = true");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, [], `Config: \n${config}`);
    });

    test("Incorrect if condition via variable declaration, variable names don't match", () => {
        const config = testConfig("b", "var test = true");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(8, 6), Position.create(8, 8)),
            VAR_NAMES_DONT_MATCH("b"),
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });
});
