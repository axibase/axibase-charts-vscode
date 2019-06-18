import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";
import assert = require("assert");

suite("URL placeholders", () => {
    test("Validation is successful if url placeholders are resolved", () => {
        let validator = new Validator(`
[configuration]
    url = https://{server}.example.com
[group]
[widget]
    type = chart
[series]
    entity = e
    metric = m
[placeholders]
    server = foo
        `);
        let diags = validator.lineByLine();

        assert.deepStrictEqual(diags, []);
    });

    test("Fails if placeholder section is missing while placeholders required", () => {
        let validator = new Validator(`
[configuration]
url = https://{server}.example.com
[group]
[widget]
    type = chart
[series]
    entity = e
    metric = m
        `);
        let diags = validator.lineByLine();

        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(4, 1, 4, 1 + "widget".length),
            "Required section [placeholders] is not declared.",
            DiagnosticSeverity.Error
        )]);
    });

    test("Fails if placeholder is missing while placeholders required", () => {
        let validator = new Validator(`
[configuration]
url = https://{server}.example.com
[group]
[widget]
    type = chart
[series]
    entity = e
    metric = m
[placeholders]
        `);
        let diags = validator.lineByLine();

        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(9, 1, 9, 1 + "placeholders".length),
            "Missing placeholders: server.",
            DiagnosticSeverity.Error
        )]);
    });

    test("Placeholder requirements can be inherited", () => {
        let validator = new Validator(`
[configuration]
url = https://{server}.example.com
[group]
[widget]
    url-parameters = ?foo={test}
    type = chart
[series]
    entity = e
    metric = m
[placeholders]
        `);
        let diags = validator.lineByLine();

        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(10, 1, 10, 1 + "placeholders".length),
            "Missing placeholders: server, test.",
            DiagnosticSeverity.Error
        )]);
    });

    test("Placeholder requirements can be overwritten", () => {
        let validator = new Validator(`
[configuration]
url = https://{server}.example.com
url-parameters = ?foo={other}
[group]
[widget]
    url-parameters = ?foo={test}
    type = chart
[series]
    entity = e
    metric = m
[placeholders]
        `);
        let diags = validator.lineByLine();

        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(11, 1, 11, 1 + "placeholders".length),
            "Missing placeholders: server, test.",
            DiagnosticSeverity.Error
        )]);
    });

    test("Fails for each widget separately", () => {
        let validator = new Validator(`
[configuration]
url = https://{server}.example.com
url-parameters = ?foo={other}
[group]
[widget]
    type = chart
[series]
    entity = e
    metric = m
[placeholders]
[widget]
    type = chart
[series]
    entity = e
    metric = m
[placeholders]
        other = 12
        `);
        let diags = validator.lineByLine();

        assert.deepStrictEqual(diags, [
            createDiagnostic(
                Range.create(10, 1, 10, 1 + "placeholders".length),
                "Missing placeholders: server, other.",
                DiagnosticSeverity.Error
            ),
            createDiagnostic(
                Range.create(16, 1, 16, 1 + "placeholders".length),
                "Missing placeholders: server.",
                DiagnosticSeverity.Error
            ),
        ]);
    });

    test("Warns if unnecessary placeholder found", () => {
        let validator = new Validator(`
[configuration]
[group]
[widget]
    type = chart
[series]
    entity = e
    metric = m
[placeholders]
    server = foo
        `);
        let diags = validator.lineByLine();

        assert.deepStrictEqual(diags, [createDiagnostic(
            Range.create(8, 1, 8, 1 + "placeholders".length),
            "Unnecessary placeholders: server.",
            DiagnosticSeverity.Warning
        )]);
    });
});
