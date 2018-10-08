import * as assert from "assert";
import { Diagnostic, DiagnosticSeverity, Position } from "vscode-languageserver";
import { SectionStack } from "../sectionStack";
import { TextRange } from "../textRange";

suite("SectionStack tests", () => {
    let stack!: SectionStack;

    setup(() => {
        stack = new SectionStack();
    });

    test("Inserts configuration section successfully", () => {
        let error = stack.insertSection(textRange("configuration"));
        assert.strictEqual(error, null);
    });

    test("Inserts configuration, group, widget and section successfully", () => {
        let error: Diagnostic | null;
        error = stack.insertSection(textRange("configuration"));
        assert.strictEqual(error, null);
        error = stack.insertSection(textRange("group", 1));
        assert.strictEqual(error, null);
        error = stack.insertSection(textRange("widget", 2));
        assert.strictEqual(error, null);
        error = stack.insertSection(textRange("series", 3));
        assert.strictEqual(error, null);
        error = stack.finalize();
        assert.strictEqual(error, null);
    });

    test("Rises error if wrong section is inserted", () => {
        stack.insertSection(textRange("configuration"));
        const error = stack.insertSection(textRange("widget", 1));
        assert.deepStrictEqual(error, Diagnostic.create(
            textRange("widget", 1).range,
            "Unexpected section [widget]. Expected [group].",
            DiagnosticSeverity.Error
        ));
    });

    test("Rises error if section has unresolved dependencies", () => {
        stack.insertSection(textRange("configuration"));
        const error = stack.finalize();
        assert.deepStrictEqual(error, Diagnostic.create(
            textRange("configuration").range,
            "Required section [group] is not declared.",
            DiagnosticSeverity.Error
        ));
    });

    test("Rises error if second section has unresolved dependencies", () => {
        stack.insertSection(textRange("configuration", 0));
        stack.insertSection(textRange("group", 1));
        stack.insertSection(textRange("widget", 2));
        stack.insertSection(textRange("group", 3));
        const error = stack.finalize();
        assert.deepStrictEqual(error, Diagnostic.create(
            textRange("group", 3).range,
            "Required section [widget] is not declared.",
            DiagnosticSeverity.Error
        ));
    });

    test("Rises error if first section has unresolved dependencies", () => {
        stack.insertSection(textRange("configuration", 0));
        stack.insertSection(textRange("group", 1));
        const error = stack.insertSection(textRange("group", 2));
        assert.deepStrictEqual(error, Diagnostic.create(
            textRange("group", 1).range,
            "Required section [widget] is not declared.",
            DiagnosticSeverity.Error
        ));
    });

    test("Rises error on attempt to insert unknown section", () => {
        const error = stack.insertSection(textRange("bad"));
        assert.deepStrictEqual(error, Diagnostic.create(
            textRange("bad").range,
            "Unknown section [bad].",
            DiagnosticSeverity.Error
        ));
    });

    function textRange(text: string, line: number = 0): TextRange {
        return new TextRange(text, {
            start: Position.create(line, 1),
            end: Position.create(line, text.length),
        });
    }

})