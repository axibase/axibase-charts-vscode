import assert = require("assert");
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

const config = `[configuration]
entity = d
metric = t
[group]
[widget]`;

const colorsMsg = `Replace multiple \`colors\` settings with one, for example:
colors = red
colors = yellow
colors = green

colors = red, yellow, green`;

const thresholdsMsg = `Replace multiple \`thresholds\` settings with one, for example:
thresholds = 0
thresholds = 60
thresholds = 80

thresholds = 0, 60, 80`;

suite("RelatedSettings: thresholds and colors tests", () => {
    test("Correct number of colors: \"thresholds\" declared before \"colors\"", () => {
        const conf = `${config}
        type = gauge
        thresholds = 0, 60, 80, 100
        colors = green, orange, red
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Correct number of colors: \"thresholds\" declared after \"colors\"", () => {
        const conf = `${config}
        type = gauge
        colors = green, orange, red
        thresholds = 0, 60, 80, 100
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Correct: colors declared as rgb", () => {
        const conf = `${config}
        type = gauge
        thresholds = 0, 10, 20, 30
        colors = rgb(247,251,255), rgb(222,235,247), rgb(198,219,239)
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Correct: \"colors\" declared without \"thresholds\" for bar", () => {
        const conf = `${config}
        type = bar
        timespan = 5 minute
        colors = darkorange, darkblue, darkred
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    // tslint:disable-next-line:max-line-length
    test("Correct: number of \"colors\" != number of \"thresholds\" - 1  for chart (\"thresholds\" have no effect)", () => {
        const conf = `${config}
        type = chart
        colors = green
        thresholds = 0, 60, 80, 100
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Incorrect number of colors: \"thresholds\" declared before \"colors\"", () => {
        const conf = `${config}
        type = gauge
        thresholds = 0, 40, 60, 80, 100
colors = green, orange, red
[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "colors".length)),
            "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
            DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    test("Incorrect number of colors: \"thresholds\" declared after \"colors\"", () => {
        const conf = `${config}
        type = calendar
colors = green, orange, red
        thresholds = 0, 40, 60, 80, 100
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(6, 0),
                Position.create(6, "colors".length)),
            "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
            DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    test("Incorrect: \"colors\" declared without \"thresholds\" for treemap", () => {
        const conf = `${config}
        type = treemap
        timespan = 5 minute
colors = darkorange, darkblue, darkred
[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(8, 1), Position.create(8, "[series".length)),
            `thresholds is required if colors is specified`, DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    test("Incorrect number of colors: several widgets", () => {
        const conf = `${config}
        type = gauge
        thresholds = 0, 40, 60, 80, 100
colors = green, orange, red
        [series]

      [widget]
        type = treemap
        thresholds = 0, 40, 60, 80, 100
colors = green, orange, red
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 0),
                Position.create(7, "colors".length)),
            "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
            DiagnosticSeverity.Error,
        ),
        createDiagnostic(
            Range.create(Position.create(13, 0),
                Position.create(13, "colors".length)),
            "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
            DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    let deprecate = [createDiagnostic(Range.create(Position.create(7, 0),
        Position.create(7, "thresholds".length)), thresholdsMsg, DiagnosticSeverity.Warning,
    ),
    createDiagnostic(Range.create(Position.create(8, 0),
        Position.create(8, "thresholds".length)), thresholdsMsg, DiagnosticSeverity.Warning,
    )];

    test("Correct: both multiline", () => {
        const conf = `${config}
            type = gauge
            thresholds = 0
thresholds = Math.max(0, 25)
thresholds = 100
            colors = silver
colors = orange
            [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, deprecate.concat(
            createDiagnostic(Range.create(Position.create(10, 0),
                Position.create(10, "colors".length)), colorsMsg, DiagnosticSeverity.Warning,
            )), `Config: \n${conf}`);
    });

    test("Correct: \"thresholds\" is multiline", () => {
        const conf = `${config}
            type = gauge
            thresholds = 0
thresholds = Math.max(0, 25)
thresholds = 100
            colors = silver, orange
            [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, deprecate, `Config: \n${conf}`);
    });

    test("Incorrect number of colors: \"thresholds\" is multiline", () => {
        const conf = `${config}
            type = gauge
            thresholds = 0
thresholds = Math.max(0, 25)
thresholds = 100
colors = silver
    [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, deprecate.concat(createDiagnostic(
            Range.create(Position.create(9, 0),
                Position.create(9, "colors".length)),
            "Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.",
            DiagnosticSeverity.Error,
        )), `Config: \n${conf}`);
    });
});

suite("RelatedSettings: \"forecast-style\" and \"data-type\" tests", () => {
    test("Correct: \"data-type\" is declared in [series]", () => {
        const conf = `${config}
        type = chart
        title = Column chart
        timespan = 1 day
        max-range = 100
        forecast-style = stroke: magenta;

        [series]
          statistic = percentile_75
          period = 10 minute
          mode = range

        [series]
          mode = column
          data-type = forecast`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Incorrect: \"data-type\" is not declared", () => {
        const conf = `${config}
        type = chart
        mode = column
forecast-style = stroke: magenta;
[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(8, 1),
                Position.create(8, "[series".length)),
            "data-type is required if forecast-style is specified",
        )], `Config: \n${conf}`);
    });
});

suite("RelatedSettings: \"alert-style\" and \"alert-expression\" tests", () => {

    test("Correct: \"alert-expression\" is declared", () => {
        const conf = `${config}
        type = chart
        alert-expression = value > 60
        alert-style = color: red
            [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Incorrect: \"alert-expression\" is not declared", () => {
        const conf = `${config}
        type = chart
alert-style = color: red
            [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(4, 1),
                Position.create(4, "[widget".length)),
            "alert-expression is required if alert-style is specified",
        )], `Config: \n${conf}`);
    });
});

suite("RelatedSettings: \"atribute\" and \"table\" tests", () => {
    test("Incorrect: \"table\" without \"attribute\"", () => {
        const conf = `${config}
        type = chart
[series]
        entity = server
        table = cpu_busy`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(6, 1), Position.create(6, "[series".length)),
            "attribute is required if table is specified"
        )], `Config: \n${conf}`);
    });

    test("Incorrect: \"attribute\" without \"table\"", () => {
        const conf = `${config}
        type = chart
[series]
        entity = server
        attribute = cpu_busy`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(6, 1), Position.create(6, "[series".length)),
            "table is required if attribute is specified",
        )], `Config: \n${conf}`);
    });
});

suite("RelatedSettings: several widgets", () => {
    test("Incorrect: resolved local \"colors\", unresolved global because type is \"gauge\"", () => {
        const conf = `[configuration]
        entity = d
        metric = t
        colors = green, orange, red
      [group]
        [widget]
          type = gauge
[series]
        [widget]
          type = treemap
          thresholds = 20, 30, 40, 50
          colors = green, orange, red
        [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 1), Position.create(7, "[series".length)),
            `thresholds is required if colors is specified`, DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    test("Correct: thresholds in [configuration]", () => {
        const conf = `[configuration]
        entity = d
        metric = t
        thresholds = 50, 60, 70, 80
      [group]
        [widget]
          type = gauge
          colors = green, orange, red
          [series]
        [widget]
          type = treemap
          colors = green, orange, red
          [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Incorrect, no required setting: colors without thresholds", () => {
        const conf = `[configuration]
        entity = d
        metric = t
      [group]
        [widget]
          type = gauge
          colors = green, orange, red
[series]
        [widget]
          type = treemap
          colors = green, orange, red
[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(Position.create(7, 1), Position.create(7, "[series".length)),
            `thresholds is required if colors is specified`, DiagnosticSeverity.Error,
        ),
        createDiagnostic(
            Range.create(Position.create(11, 1), Position.create(11, "[series".length)),
            `thresholds is required if colors is specified`, DiagnosticSeverity.Error,
        )], `Config: \n${conf}`);
    });

    test("Correct: resolved local \"colors\", resolved global because type is \"bar\"", () => {
        const conf = `[configuration]
        entity = d
        metric = t
colors = green, orange, red
      [group]
        [widget]
          type = bar
          [series]
        [widget]
          type = treemap
          thresholds = 20, 30, 40, 50
          colors = green, orange, red
          [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});

suite("RelatedSettings: settings in if statement", () => {
    test("Correct: both alert-expression and alert-style in if statement", () => {
        const conf = `[configuration]
  entity = e
  metric = m
[group]
  [widget]
    type = table
    [column]
      if "a" == "a"
        alert-expression = value == 0 && (row.map['jmx.activemq.queuesize'].last.v > 0)
        alert-style = background-color: red; color: white
      endif
      [series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });
});
