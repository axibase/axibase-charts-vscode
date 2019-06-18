import { deepStrictEqual } from "assert";
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { uselessScope } from "../messageUtil";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

interface NegativeStyleTestCase {
        expected: Diagnostic[];
        mode?: string;
        type: string;
}

suite("Validator for negative-style setting", () => {
        const testCases: NegativeStyleTestCase[] = [
                {
                        expected: [],
                        mode: "column",
                        type: "chart"
                },
                {
                        expected: [],
                        mode: "column-stack",
                        type: "chart"
                },
                {
                        expected: [
                                createDiagnostic(Range.create(Position.create(7, 0),
                                        Position.create(7, "negative-style".length)),
                                        uselessScope("negative-style",
                                                "mode is one of column-stack, column"),
                                        DiagnosticSeverity.Warning)
                        ],
                        mode: "stack",
                        type: "chart"
                },
                {
                        expected: [],
                        type: "chart"
                },
        ];

        testCases.forEach(tCase => {
                test(`should allowed setting for chart widget in ${tCase.mode} mode with type = ${tCase.type}`, () => {
                        const config = `[configuration]
      metric = a
      entity = b
    [group]
      [widget]
        ${tCase.mode ? `mode = ${tCase.mode}` : ""}

negative-style = fill: magenta
        type = ${tCase.type}
        [series]`;
                        const validator = new Validator(config);
                        deepStrictEqual(validator.lineByLine(), tCase.expected,
                        `Should not raise warnings for type ${tCase.type}, mode ${tCase.mode}.\n Config: ${config}`);
                });
        });

        testCases.forEach(tCase => {
                test(`should allowed setting for chart widget in ${tCase.mode} mode with type = ${tCase.type}`, () => {
                        const config = `[configuration]
      metric = a
      entity = b
    [group]
      [widget]
        type = ${tCase.type}
        ${tCase.mode ? `mode = ${tCase.mode}` : ""}
negative-style = fill: magenta
        [series]`;
                        const validator = new Validator(config);
                        deepStrictEqual(validator.lineByLine(), tCase.expected,
                        `Should not raise warnings for type ${tCase.type}, mode ${tCase.mode}.\n Config: ${config}`);
                });
        });

        testCases.forEach(tCase => {
                test(`should allowed setting for chart widget in ${tCase.mode} mode with type = ${tCase.type}`, () => {
                        const config = `[configuration]
      metric = a
      entity = b
    [group]
      [widget]


negative-style = fill: magenta
        type = ${tCase.type}
        ${tCase.mode ? `mode = ${tCase.mode}` : ""}
        [series]`;
                        const validator = new Validator(config);
                        deepStrictEqual(validator.lineByLine(), tCase.expected,
                        `Should not raise warnings for type ${tCase.type}, mode ${tCase.mode}.\n Config: ${config}`);
                });
        });
});
