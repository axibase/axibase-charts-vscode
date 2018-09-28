import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("Freemarker templates", () => {
    new Test("Freemarker assign rises warning on open and close tags",
        `
    <#assign foo= ['bar', baz']>
    </#assign>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 32),
                "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(2, 4, 2, 14),
                "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker list rises warning on open and close tags",
        `
    <#list foo as bar>
    </#list>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 22),
                "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(2, 4, 2, 12),
                "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker list rises warning on open tag only",
        `
    <#list foo as bar>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 22),
                "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker list rises warning on close tag only",
        `
    <#list foo as bar>
    </#list>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 22),
                "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(2, 4, 2, 12),
                "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker does not rise warning on variable interpolation",
        `
        entity = \${entity1235}
        `,
        [],
    ).validationTest();
});
