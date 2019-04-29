import { Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("CSV tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct inline csv(header next line)",
            `csv countries =
   name, value1, value2
   Russia, 65, 63
   USA, 63, 63
endcsv`,
            [],
        ),
        new Test(
            "Correct inline csv (header this line)",
            `csv countries = name, value1, value2
   Russia, 65, 63
   USA, 63, 63
endcsv`,
            [],
        ),
        new Test(
            "Unclosed csv (header this line)",
            `csv countries = name, value1, value2
   Russia, 65, 63
   USA, 63, 63
encsv`,
            [
                createDiagnostic(
                    Range.create(Position.create(3, 0), Position.create(3, "encsv".length)),
                    "Expected 3 columns, but found 1",
                ),
                createDiagnostic(
                    Range.create(Position.create(0, 0), Position.create(0, "csv".length)),
                    "csv has no matching endcsv",
                ),
            ],
        ),
        new Test(
            "Unclosed csv (header next line)",
            `csv countries =
   name, value1, value2
   Russia, 65, 63
   USA, 63, 63
encsv`,
            [
                createDiagnostic(
                    Range.create(Position.create(4, 0), Position.create(4, "encsv".length)),
                    "Expected 3 columns, but found 1",
                ),
                createDiagnostic(
                    Range.create(Position.create(0, 0), Position.create(0, "csv".length)),
                    "csv has no matching endcsv",
                ),
            ],
        ),
        new Test(
            "Incorrect csv",
            `csv countries = name, value1, value2
   Russia, 65, 63
   USA, 63, 63, 63
endcsv`,
            [createDiagnostic(
                Range.create(Position.create(2, 0), Position.create(2, "   Russia, 65, 63\n".length)),
                "Expected 3 columns, but found 4",
            )],
        ),
        new Test(
            "Correct csv with escaped whitespaces and commas",
            `csv countries = name, value1, value2
                Russia, "6,5", 63
                USA, 63, "6 3"
            endcsv`,
            [],
        ),
        new Test(
            "Correct csv with not escaped whitespaces",
            `csv index =
                president,inauguration
                Gerald Ford, 1974
            endcsv`,
            [],
        ),
        new Test(
            "Correct csv with *",
            `csv values =
        names, ids
        All Countries, *
        Top 10 Countries, value >= top(10)
        endcsv`,
            [],
        ),
        new Test(
            "Correct csv with spaces and + ",
            `csv dbmetrics = metric              ,isSize ,isRate
            mssql.active_transactions            ,       ,
            mssql.backup_restore_throughput      ,       ,   +
            endcsv`,
            [],
        ),
        new Test(
            "Correct csv with keyword 'from'",
            `csv rows from https://raw.githubusercontent.com/axibase/atsd-use-cases/master/USVisaRefusal/Resources/visa-refusal.csv`,
            [],
        ),
        new Test(
            "Incorrect csv with missing keyword 'from'",
            `csv rows https://raw.githubusercontent.com/axibase/atsd-use-cases/master/USVisaRefusal/Resources/visa-refusal.csv`,
            [
                createDiagnostic(
                    Range.create(Position.create(0, 0), Position.create(0, "csv".length)),
                   `The line should contain a '=' or 'from' keyword`
                )
            ]
        ),
        new Test(
            "Incorrect csv 'from' with missing entity name",
            `csv from https://raw.githubusercontent.com/axibase/atsd-use-cases/master/USVisaRefusal/Resources/visa-refusal.csv`,
            [
                createDiagnostic(
                    Range.create(Position.create(0, 0), Position.create(0, "csv".length)),
                    `<name> in 'csv <name> from <url>' is missing`
                )
            ]
        ),
    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
