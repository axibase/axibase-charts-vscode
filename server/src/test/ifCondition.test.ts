import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

const testConfig = (condition: string, variable: string = "") =>
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

    test("Incorrect inline if condition", () => {
        const config = testConfig("b <> 2");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(8, 9), Position.create(8, 15)),
            "Unexpected token >",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });

    test("Correct if condition via variable declaration", () => {
        const config = testConfig("firstVar", "var firstVar = true");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, [], `Config: \n${config}`);
    });

    test("Incorrect if condition via variable declaration", () => {
        const config = testConfig("123incorrectVar", "123incorrectVar = 11");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(8, 9), Position.create(8, 24)),
            "Invalid or unexpected token",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });

    test("Correct if condition via javascript expression", () => {
        const config = testConfig("someList.length > 10");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        deepStrictEqual(actualDiagnostics, [], `Config: \n${config}`);
    });

    test("Incorrect if condition via javascript expression", () => {
        const config = testConfig("someList.length is_true");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(8, 9), Position.create(8, 32)),
            "Unexpected identifier",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });

    test("Incorrect empty if condition", () => {
        const config = testConfig("   ");
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(8, 6), Position.create(8, 8)),
            "If condition mustn't be empty",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], `Config: \n${config}`);
    });
});
