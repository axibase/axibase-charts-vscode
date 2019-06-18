import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { Util } from "language-service/dist";
import { Test } from "./test";

const deprecationMessage: string = `Freemarker expressions are deprecated.
Use a native collection: list, csv table, var object.` +
    `\nMigration examples are available at https://github.com/axibase/charts/blob/master/syntax/freemarker.md`;

suite("Freemarker templates", () => {
    new Test("Freemarker assign rises warning on open and close tags",
        `
    <#assign foo= ['bar', baz']>
    entity = e
    </#assign>
        `,
        [
            Util.createDiagnostic(
                Range.create(1, 4, 1, 32),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            Util.createDiagnostic(
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
            Util.createDiagnostic(
                Range.create(1, 4, 1, 22),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            Util.createDiagnostic(
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
            Util.createDiagnostic(
                Range.create(1, 4, 1, 19),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            Util.createDiagnostic(
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
            Util.createDiagnostic(
                Range.create(1, 4, 1, 19),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            Util.createDiagnostic(
                Range.create(3, 4, 3, 11),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            Util.createDiagnostic(
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
            Util.createDiagnostic(
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
            Util.createDiagnostic(
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

    new Test("De-alias doesn't raise an error",
        `value = 0 <#list sid[1]?split(",") as lpar> + value('\$\{lpar\}:PX')</#list>`,
        [Util.createDiagnostic(
            Range.create(0, 10, 0, 43),
            deprecationMessage,
            DiagnosticSeverity.Information,
        )],
    ).validationTest();

    new Test("Alias doesn't exist, error",
        `value = 0 <#list sid[1]?split(",") as lpar> + value('\${lpr}:PX')</#list>`,
        [
            Util.createDiagnostic(
                Range.create(0, 10, 0, 43),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            Util.createDiagnostic(
                Range.create(0, `value = 0 <#list sid[1]?split(",") as lpar> + value('$\{`.length, 0,
                    `value = 0 <#list sid[1]?split(",") as lpar> + value('$\{lpr`.length),
                "lpr is unknown.",
                DiagnosticSeverity.Error,
            )
        ],
    ).validationTest();

    new Test("No issues except warning",
        `<#list lpars as lpar>
[widget]
type = chart
title = [$\{lpar[2]}] [CEC agent:- $\{lpar[0]}] [Frame:- \${lpar[1]}]
timespan = 7 day
</#list>
    `,
        [
            Util.createDiagnostic(
                Range.create(0, 0, 0, 21),
                deprecationMessage,
                DiagnosticSeverity.Information,
            ),
            Util.createDiagnostic(
                Range.create(5, 0, 5, 8),
                deprecationMessage,
                DiagnosticSeverity.Information,
            )
        ],
    ).validationTest();
});
