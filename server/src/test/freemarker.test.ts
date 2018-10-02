import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

const deprecationMessage: string = `Freemarker expressions are deprecated.\nUse a native collection: list, csv table, var object.` +
    `\nMigration examples are available at https://github.com/axibase/charts/blob/master/syntax/freemarker.md`

suite("Freemarker templates", () => {
    new Test("Freemarker assign rises warning on open and close tags",
        `
    <#assign foo= ['bar', baz']>
    entity = e
    </#assign>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 32),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(3, 4, 3, 14),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker list rises warning on open and close tags",
        `
    <#list foo as bar>
    entity = e
    </#list>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 22),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(3, 4, 3, 12),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker if rises warning on open and close tags",
        `
    <#if condition>
    entity = e
    </#if>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 19),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(3, 4, 3, 10),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker if-else rises warning on all tags",
        `
    <#if condition>
    entity = e
    <#else>
    metric=c
    </#if>
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 19),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(3, 4, 3, 11),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            createDiagnostic(
                Range.create(5, 4, 5, 10),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker list rises warning on open tag only",
        `
    <#list foo as bar>
    entity = e
        `,
        [
            createDiagnostic(
                Range.create(1, 4, 1, 22),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
        ],
    ).validationTest();

    new Test("Freemarker list rises warning on close tag only",
        `
    entity = e
    </#list>
        `,
        [
            createDiagnostic(
                Range.create(2, 4, 2, 12),
                deprecationMessage,
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
