import assert = require("assert");
import { Util } from "language-service/dist";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
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
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
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
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
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
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
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

suite("Forecast settings validation: forecast-ssa-group-manual-groups", () => {
    test("Incorrect: value = 1-10,2-d", () => {
        const conf = `${config}
forecast-ssa-group-manual-groups = 1-10,2-d`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-group-manual-groups".length)),
            "Incorrect group syntax", DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Incorrect: value = 1,d", () => {
        const conf = `${config}
forecast-ssa-group-manual-groups = 1,d`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-group-manual-groups".length)),
            "Incorrect group syntax", DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Correct: value = 1,2-5", () => {
        const conf = `${config}
forecast-ssa-group-manual-groups = 1,2-5`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Correct: value = 1; 2-5", () => {
        const conf = `${config}
forecast-ssa-group-manual-groups = 1; 2-5`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});

suite("Forecast settings validation: forecast-ssa-group-auto-union", () => {
    test("Incorrect: value = A-B,12", () => {
        const conf = `${config}
forecast-ssa-group-auto-union = A-B,12`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-group-auto-union".length)),
            "Incorrect group union syntax", DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Incorrect: value = A-B;12", () => {
        const conf = `${config}
forecast-ssa-group-auto-union = A-B;12`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-group-auto-union".length)),
            "Incorrect group union syntax", DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Correct: value = A-B,C", () => {
        const conf = `${config}
forecast-ssa-group-auto-union = A-B,C`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Correct: value = A-B;C", () => {
        const conf = `${config}
forecast-ssa-group-auto-union = A-B;C`;
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
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(8, 0),
                Position.create(8, "forecast-arima-auto-regression-interval".length)),
            "forecast-arima-auto-regression-interval setting is appplied only if forecast-arima-auto is false.",
            DiagnosticSeverity.Warning),
        Util.createDiagnostic(
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
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
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
    test("Incorrect: forecast-ssa-group-manual-groups excludes some auto params", () => {
        const conf = `${config}
forecast-ssa-group-manual-groups = 13-
forecast-ssa-group-auto-clustering-method = XMEANS
forecast-ssa-group-auto-clustering-params = {}
forecast-ssa-group-auto-stack = false`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [
            Util.createDiagnostic(
                Range.create(Position.create(8, 0),
                    Position.create(8, "forecast-ssa-group-auto-clustering-method".length)),
                "forecast-ssa-group-auto-clustering-method can not be specified simultaneously " +
                "with forecast-ssa-group-manual-groups",
                DiagnosticSeverity.Error),
            Util.createDiagnostic(
                Range.create(Position.create(9, 0),
                    Position.create(9, "forecast-ssa-group-auto-clustering-params".length)),
                "forecast-ssa-group-auto-clustering-params can not be specified simultaneously " +
                "with forecast-ssa-group-manual-groups",
                DiagnosticSeverity.Error),
            Util.createDiagnostic(
                Range.create(Position.create(10, 0),
                    Position.create(10, "forecast-ssa-group-auto-stack".length)),
                "forecast-ssa-group-auto-stack can not be specified simultaneously " +
                "with forecast-ssa-group-manual-groups",
                DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Incorrect: forecast-ssa-group-auto-union forecast-ssa-group-auto-stack are mutually exclusive", () => {
        let conf = `${config}
forecast-ssa-group-auto-stack = false
forecast-ssa-group-auto-union = A,B,C-E`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [
            Util.createDiagnostic(
                Range.create(Position.create(8, 0),
                    Position.create(8, "forecast-ssa-group-auto-stack".length)),
                "forecast-ssa-group-auto-union can not be specified simultaneously " +
                "with forecast-ssa-group-auto-stack",
                DiagnosticSeverity.Error)], `Config: \n${conf}`);

        conf = `${config}
forecast-ssa-group-auto-union = A,B,C-E
forecast-ssa-group-auto-stack = false`;
        validator = new Validator(conf);
        diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [
            Util.createDiagnostic(
                Range.create(Position.create(8, 0),
                    Position.create(8, "forecast-ssa-group-auto-union".length)),
                "forecast-ssa-group-auto-stack can not be specified simultaneously " +
                "with forecast-ssa-group-auto-union",
                DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Correct: forecast-ssa-group-auto-count does not exclude forecast-ssa-group-manual-groups", () => {
        const conf = `${config}
forecast-ssa-decompose-eigentriple-limit = 2
forecast-ssa-group-auto-count = 1
forecast-ssa-group-manual-groups = 13-`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});

suite("Related forecast settings checks: forecast-horizon", () => {
    test("Incorrect: forecast-horizon-end-time excludes forecast-horizon-interval", () => {
        const conf = `${config}
forecast-horizon-end-time = now
forecast-horizon-interval = 1 week`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(8, 0),
                Position.create(8, "forecast-horizon-interval".length)),
            "forecast-horizon-interval can not be specified simultaneously with forecast-horizon-end-time",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });
});

suite("Related forecast settings checks: forecast-ssa-decompose-eigentriple-limit and group-auto-count", () => {
    test("Incorrect: no forecast-ssa-decompose-eigentriple-limit (default value is used)", () => {
        const conf = `${config}
forecast-ssa-group-auto-count = 0`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-group-auto-count".length)),
            "forecast-ssa-group-auto-count must be less than forecast-ssa-decompose-eigentriple-limit (default 0)",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Incorrect: forecast-ssa-decompose-eigentriple-limit less than group-auto-count", () => {
        const conf = `${config}
forecast-ssa-group-auto-count = 5
forecast-ssa-decompose-eigentriple-limit = 4`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "forecast-ssa-group-auto-count".length)),
            "forecast-ssa-group-auto-count must be less than forecast-ssa-decompose-eigentriple-limit (default 0)",
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Correct: forecast-ssa-decompose-eigentriple-limit bigger than group-auto-count", () => {
        const conf = `${config}
forecast-ssa-group-auto-count = 5
forecast-ssa-decompose-eigentriple-limit = 6`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});

suite("Related forecast settings checks: forecast-horizon-*", () => {
    test("Incorrect: only forecast-horizon-start-time", () => {
        const conf = `${config}
forecast-horizon-start-time = now - 2*day`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [Util.createDiagnostic(
            Range.create(Position.create(6, 1),
                Position.create(6, "series".length + 1)),
            `forecast-horizon-start-time has effect only with one of the following:
 * forecast-horizon-end-time
 * forecast-horizon-interval
 * forecast-horizon-length`,
            DiagnosticSeverity.Error)], `Config: \n${conf}`);
    });

    test("Correct: forecast-horizon-start-time and forecast-horizon-end-time", () => {
        const conf = `${config}
forecast-horizon-end-time = now
forecast-horizon-start-time = now - 2*day`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});
