import assert = require("assert");
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

const config = `[configuration]
entity = d
metric = t
[group]
[widget]
type=chart
[series]`;

suite("Validator: isAllowedInSection() tests", () => {
    test("Incorrect: mode = column-stack is resctricted in series", () => {
        const conf = `${config}
mode = column-stack`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "mode".length)),
            "mode setting is not allowed here.", DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    test("Correct: mode = column", () => {
        const conf = `${config}
mode = column`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});
