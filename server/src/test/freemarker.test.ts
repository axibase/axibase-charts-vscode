import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { unknownToken } from "../messageUtil";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("FreeMarker unknown variables", () => {
    const tests: Test[] = [
        new Test(
            "Correct usage",
            `<#assign lpars = [
   ["abc:KUX","abc"]
  ,["cde:KUX","cde"]
]>

<#list lpars as lpar>

[group]
[widget]
    type = gauge
    title = \${lpar[1]}

<#assign cpus = getTags("nmon.cpu.idle%", "example", "id") >
<#list cpus as id >
    [series]
        entity = example
        metric = \${100 * id}
</#list>`,
            [
                createDiagnostic(
                    Range.create(0, 0, 0, "<#assign".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(5, 0, 5, "<#list".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(12, 0, 12, "<#assign".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(13, 0, 13, "<#list".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
            ],
        ),
        new Test(
            "Undeclared entity usage",
            `<#assign lpars = [
   ["abc:KUX","abc"]
  ,["cde:KUX","cde"]
]>

<#list lpars as lpar>

[group]
[widget]
    type = gauge
    title = \${entity}`,
            [
                createDiagnostic(
                    Range.create(0, 0, 0, "<#assign".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(5, 0, 5, "<#list".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
            ],
        ),
        new Test(
            "Misspelt variable name",
            `<#assign lpars = [
   ["abc:KUX","abc"]
  ,["cde:KUX","cde"]
]>

<#list lpars as lpar>

[group]
[widget]
    type = gauge
    title = \${lbar[1]}
    label = \${100 * lbar}`,
            [
                createDiagnostic(
                    Range.create(0, 0, 0, "<#assign".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(5, 0, 5, "<#list".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(10, "    title = \${".length, 10, "    title = \${".length + "lbar".length),
                    unknownToken("lbar"),
                ),
                createDiagnostic(
                    Range.create(11, "    label = \${100 * ".length, 11, "    label = \${100 * lbar".length),
                    unknownToken("lbar"),
                ),
            ],
        ),
        new Test(
            "Misspelt array name",
            `<#assign lpars = [
   ["abc:KUX","abc"]
  ,["cde:KUX","cde"]
]>

<#list lbars as lpar>

[group]
[widget]
    type = gauge
    title = \${lpar[1]}`,
            [
                createDiagnostic(
                    Range.create(0, 0, 0, "<#assign".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(5, 0, 5, "<#list".length),
                    "Freemarker expressions are deprecated. Use a native collection: list, csv table, var object.",
                    DiagnosticSeverity.Information,
                ),
                createDiagnostic(
                    Range.create(5, "<#list ".length, 5, "<#list ".length + "lbars".length),
                    unknownToken("lbars"),
                ),
            ],
        ),
    ];

    for (const test of tests) {
        test.validationTest();
    }
});
