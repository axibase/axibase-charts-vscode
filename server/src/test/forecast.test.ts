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

suite("Forecast settings validation: group-auto-clustering-params", () => {
    test("Incorrect object: non-paired quote", () => {
        const conf = `${config}
forecast-ssa-group-auto-clustering-params = { "v: 0.5}`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-group-auto-clustering-params".length)),
            "Invalid object specified: Unexpected end of JSON input", DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    test("Correct object", () => {
        const conf = `${config}
forecast-ssa-group-auto-clustering-params = { "v": 0.5}`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});

suite("Forecast settings validation: forecast-ssa-decompose-window-length", () => {
    test("Incorrect: value = 0", () => {
        const conf = `${config}
forecast-ssa-decompose-window-length = 0`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-decompose-window-length".length)),
            "forecast-ssa-decompose-window-length should be in range (0, 50]. For example, 50",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Incorrect: value = 51", () => {
        const conf = `${config}
forecast-ssa-decompose-window-length = 51`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-decompose-window-length".length)),
            "forecast-ssa-decompose-window-length should be in range (0, 50]. For example, 50",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Correct: value = 50", () => {
        const conf = `${config}
forecast-ssa-decompose-window-length = 50`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Correct: value = 1.5", () => {
        const conf = `${config}
forecast-ssa-decompose-window-length = 1.5`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});

suite("Related forecast settings checks: forecast-arima", () => {
    test("Incorrect: if forecast-arima-auto=true, manual parameters are not applied", () => {
        const conf = `${config}
forecast-arima-auto = true
forecast-arima-auto-regression-interval = 1 week
forecast-arima-d = 5.6`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(8, 0),
                Position.create(8, "forecast-arima-auto-regression-interval".length)),
            "forecast-arima-auto-regression-interval setting is appplied only if forecast-arima-auto is false.",
            DiagnosticSeverity.Warning),
        createDiagnostic(
            Range.create(Position.create(9, 0),
                Position.create(9, "forecast-arima-d".length)),
            "forecast-arima-d setting is appplied only if forecast-arima-auto is false.",
            DiagnosticSeverity.Warning)
        ], `Config: \n${conf}`);
    });

    test("Incorrect: forecast-arima-auto-regression-interval excludes forecast-arima-p", () => {
        const conf = `${config}
forecast-arima-auto-regression-interval = 1 week
forecast-arima-p = 1`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(8, 0),
                Position.create(8, "forecast-arima-p".length)),
            "forecast-arima-p can not be specified simultaneously with forecast-arima-auto-regression-interval",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Correct: if forecast-arima-auto=false, manual parameters are applied", () => {
        const conf = `${config}
forecast-arima-auto = false
forecast-arima-p = 1
forecast-arima-d = 5.6`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});

suite("Related forecast settings checks: forecast-ssa", () => {
    test("Incorrect: forecast-ssa-group-manual-groups excludes auto params", () => {
        const conf = `${config}
forecast-ssa-group-manual-groups = 13-
forecast-ssa-group-auto-count = 10
forecast-ssa-group-auto-clustering-method = XMEANS
forecast-ssa-group-auto-clustering-params = {}
forecast-ssa-group-auto-stack = false
forecast-ssa-group-auto-union = A;B;C-E`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(8, 0),
                Position.create(8, "forecast-ssa-group-auto-count".length)),
            "forecast-ssa-group-auto-count can not be specified simultaneously with forecast-ssa-group-manual-groups",
            DiagnosticSeverity.Error),
        createDiagnostic(
            Range.create(Position.create(9, 0),
                Position.create(9, "forecast-ssa-group-auto-clustering-method".length)),
            "forecast-ssa-group-auto-clustering-method can not be specified simultaneously " +
            "with forecast-ssa-group-manual-groups",
            DiagnosticSeverity.Error),
        createDiagnostic(
            Range.create(Position.create(10, 0),
                Position.create(10, "forecast-ssa-group-auto-clustering-params".length)),
            "forecast-ssa-group-auto-clustering-params can not be specified simultaneously " +
            "with forecast-ssa-group-manual-groups",
            DiagnosticSeverity.Error),
        createDiagnostic(
            Range.create(Position.create(11, 0),
                Position.create(11, "forecast-ssa-group-auto-stack".length)),
            "forecast-ssa-group-auto-stack can not be specified simultaneously with forecast-ssa-group-manual-groups",
            DiagnosticSeverity.Error),
        createDiagnostic(
            Range.create(Position.create(12, 0),
                Position.create(12, "forecast-ssa-group-auto-union".length)),
            "forecast-ssa-group-auto-union can not be specified simultaneously with forecast-ssa-group-manual-groups",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Incorrect: forecast-ssa-group-auto-count excludes forecast-ssa-group-manual-groups", () => {
        const conf = `${config}
forecast-ssa-group-auto-count = 10
forecast-ssa-group-manual-groups = 13-`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(8, 0),
                Position.create(8, "forecast-ssa-group-manual-groups".length)),
            "forecast-ssa-group-manual-groups can not be specified simultaneously " +
            "with forecast-ssa-group-auto-count",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });
});
