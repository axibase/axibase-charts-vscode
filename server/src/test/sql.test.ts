import assert = require("assert");
import { DEFAULT_FORMATTING_OPTIONS, Formatter } from "../formatter";
import { lineFeedRequired, noMatching } from "../messageUtil";
import { createDiagnostic, createRange } from "../util";
import { Validator } from "../validator";

const base = `[configuration]
entity = d
metric = t

[group]

[widget]
type=chart`;

suite("Validator: SQL tests", () => {
    test("Correct SQL block", () => {
        const conf = `${base}
sql
  SELECT 1
  endsql

[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [], `Config: \n${conf}`);
    });

    test("Incorrect SQL block: no endsql", () => {
        const conf = `${base}
sql
 SELECT 1
endsq

[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [
            createDiagnostic(createRange(0, "sql".length, 8), noMatching("sql", "endsql")),
            createDiagnostic(createRange(1, "widget".length, 6),
                "Required section [series] is not declared."),
        ], `Config: \n${conf}`);
    });

    test("Incorrect SQL block: no sql", () => {
        const conf = `${base}
sq
 SELECT 1
endsql

[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [
            createDiagnostic(createRange(0, "endsql".length, 10), noMatching("endsql", "sql"))
        ], `Config: \n${conf}`);
    });

    test("Incorrect SQL block: no linefeed", () => {
        const conf = `${base}
sql SELECT 1
endsql

[series]`;
        let validator = new Validator(conf);
        let diags = validator.lineByLine();
        assert.deepStrictEqual(diags, [
            createDiagnostic(createRange(0, "sql".length, 8), lineFeedRequired("sql"))
        ], `Config: \n${conf}`);
    });
});

suite("Formatter: SQL indents tests", () => {
    const config =
        "\n  [widget]\n" +
        "    type = chart\n" +
        "    sql = SELECT time, entity, value FROM cpu_busy\n" +
        "    sql = WHERE /* time */ > now - 5 * minute\n\n" +
        "    [series]\n\n" +
        "" +
        "  [widget]\n" +
        "    type = chart\n" +
        "    sql\n" +
        "      SELECT time, entity, value FROM cpu_busy\n" +
        "      WHERE /* time */ > now - 5 * minute\n" +
        "    endsql\n\n" +
        "    [series]\n"
        ;
    const formatter = new Formatter(config, DEFAULT_FORMATTING_OPTIONS);
    assert.deepStrictEqual(formatter.lineByLine(), []);
});
