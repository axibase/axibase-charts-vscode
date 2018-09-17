/* tslint:disable:no-magic-numbers */
import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("Type check tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct boolean settings",
            `[configuration]
  add-meta = false
[configuration]
  add-meta = no
[configuration]
  add-meta = nO
[configuration]
  add-meta = null
[configuration]
  add-meta = none
[configuration]
  add-meta = 0
[configuration]
  add-meta = off
[configuration]
  add-meta = true
[configuration]
  add-meta = yes
[configuration]
  add-meta = yEs
[configuration]
  add-meta = on
[configuration]
  add-meta = 1
`,
            [],
        ),
        new Test(
            "Incorrect boolean setting",
            `[configuration]
  add-meta = not
[configuration]
  add-meta = false true
[configuration]
  add-meta = OFF 1
`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  add-meta".length),
                    DiagnosticSeverity.Error, "add-meta type is boolean",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  add-meta".length),
                    DiagnosticSeverity.Error, "add-meta type is boolean",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  add-meta".length),
                    DiagnosticSeverity.Error, "add-meta type is boolean",
                ),
            ],
        ),
        new Test(
            "Correct number settings",
            `[configuration]
  arrow-length = 1
[configuration]
  arrow-length = 100000
[configuration]
  arrow-length = -100000
[configuration]
  arrow-length = +100000
[configuration]
  arrow-length = .3
[configuration]
  arrow-length = 0.3
[configuration]
  arrow-length = 0.333333333
[configuration]
  arrow-length = 1000.333333333
`,
            [],
        ),
        new Test(
            "Incorrect number settings",
            `[configuration]
  arrow-length = false
[configuration]
  arrow-length = 5 + 5
[configuration]
  arrow-length = 5+5
[configuration]
  arrow-length = 5.0 + 5
[configuration]
  arrow-length = 5.0+5
[configuration]
  arrow-length = 5 + 5.0
[configuration]
  arrow-length = 5+5.0
[configuration]
  arrow-length = 5 hello
[configuration]
  arrow-length = 5hello
[configuration]
  arrow-length = hello5
[configuration]
  arrow-length = hello 5
`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(9, "  ".length, 9, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(11, "  ".length, 11, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(13, "  ".length, 13, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(15, "  ".length, 15, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(17, "  ".length, 17, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(19, "  ".length, 19, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
                createDiagnostic(
                    Range.create(21, "  ".length, 21, "  arrow-length".length),
                    DiagnosticSeverity.Error, "arrow-length type is number",
                ),
            ],
        ),
        new Test(
            "Correct enum settings",
            `[configuration]
  bottom-axis = percentiles
  buttons = update
  case = upper
  counter-position = top
  `,
            [],
        ),
        new Test(
            "Incorrect enum settings",
            `[configuration]
  bottom-axis = percentile
  buttons = updat
  case = uppe
  counter-position = to
  `,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  bottom-axis".length),
                    DiagnosticSeverity.Error, "bottom-axis must be one of:\nnone;\npercentiles;\nvalues",
                ),
                createDiagnostic(
                    Range.create(2, "  ".length, 2, "  buttons".length),
                    DiagnosticSeverity.Error, "buttons must be one of:\nmenu;\nupdate",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  case".length),
                    DiagnosticSeverity.Error, "case must be one of:\nupper;\nlower",
                ),
                createDiagnostic(
                    Range.create(4, "  ".length, 4, "  counter-position".length),
                    DiagnosticSeverity.Error, "counter-position must be one of:\nnone;\ntop;\nbottom",
                ),
            ],
        ),
        new Test(
            "Correct date tests",
            `[configuration]
  start-time = 2018
[configuration]
  start-time = 2018-12
[configuration]
  start-time = 2018-12-31
[configuration]
  start-time = 2018-12-31 15:43
[configuration]
  start-time = 2018-12-31 15:43:32
[configuration]
  start-time = 2018-12-31T15:43:32Z
[configuration]
  start-time = 2018-12-31T15:43:32.123Z
[configuration]
  start-time = 2018-12-31T15:43:32.123+0400
[configuration]
  start-time = 2018-12-31T15:43:32.123-0400
[configuration]
  start-time = 2018-12-31T15:43:32.123-04:00
[configuration]
  start-time = 2018-12-31T15:43:32.123+04:00
[configuration]
  start-time = 2018-12-31T15:43:32+04:00
[configuration]
  start-time = 2018-12-31T15:43:32-04:00
[configuration]
  start-time = previous_week
[configuration]
  start-time = current_month
[configuration]
  start-time = current_month + 5 * day
[configuration]
  start-time = current_month + 0.5 * hour
[configuration]
  start-time = current_month + .5 * week
[configuration]
  start-time = current_month - .5 * week
`,
            [],
        ),
        new Test(
            "Incorrect date tests",
            `[configuration]
  start-time = 1969
[configuration]
  start-time = 2018-13
[configuration]
  start-time = 2018-12-32
[configuration]
  start-time = 2018-12-31 25:43
[configuration]
  start-time = 2018-12-31 15:73:22
[configuration]
  start-time = 2018-12-31 15:43:72
[configuration]
  start-time = 2018-12-31T15:43:32U
[configuration]
  start-time = 2018-12-31 15:43:32Z
[configuration]
  start-time = 2018-12-31T15:43:32.12345678911Z
[configuration]
  start-time = 2018-12-31T15:43:32.123-0460
[configuration]
  start-time = 2018-12-31T15:43:32.123+0460
[configuration]
  start-time = 2018-12-31T15:43:32.123+3400
[configuration]
  start-time = 2018-12-31T15:43:32.123-3400
[configuration]
  start-time = 2018-12-31T15:43:32.123*0400
[configuration]
  start-time = 2018-12-31T15:43:32.123-34:60
[configuration]
  start-time = 2018-12-31T15:43:32.123-34:00
[configuration]
  start-time = previos_week
[configuration]
  start-time = 5 * day + current_month
[configuration]
  start-time = current_month  0.5 * hour
[configuration]
  start-time = current_month + .5 / week
[configuration]
  start-time = current_month - .5 * my_period
`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(9, "  ".length, 9, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(11, "  ".length, 11, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(13, "  ".length, 13, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(15, "  ".length, 15, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(17, "  ".length, 17, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(19, "  ".length, 19, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(21, "  ".length, 21, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(23, "  ".length, 23, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(25, "  ".length, 25, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(27, "  ".length, 27, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(29, "  ".length, 29, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(31, "  ".length, 31, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(33, "  ".length, 33, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(35, "  ".length, 35, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(37, "  ".length, 37, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(39, "  ".length, 39, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
                createDiagnostic(
                    Range.create(41, "  ".length, 41, "  start-time".length),
                    DiagnosticSeverity.Error, "start-time type is date",
                ),
            ],
        ),
        new Test(
            "Correct interval tests",
            `[configuration]
  disconnect-interval = 1 minute
[configuration]
  disconnect-interval = 20 hour
[configuration]
  disconnect-interval = 15 month
[configuration]
  disconnect-interval = 0.25 year
[configuration]
  disconnect-interval = .25 year
[configuration]
  disconnect-interval = all
[configuration]
  update-interval = 10 second
  `,
            [],
        ),
        new Test(
            "Incorrect interval tests",
            `[configuration]
  disconnect-interval = 1 minutes
[configuration]
  disconnect-interval = 20 hours
[configuration]
  disconnect-interval = month
[configuration]
  disconnect-interval = year 0.25
[configuration]
  disconnect-interval = . year
[configuration]
  update-interval = 10
  `,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  disconnect-interval".length),
                    DiagnosticSeverity.Error, "disconnect-interval type is interval",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  disconnect-interval".length),
                    DiagnosticSeverity.Error, "disconnect-interval type is interval",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  disconnect-interval".length),
                    DiagnosticSeverity.Error, "disconnect-interval type is interval",
                ),
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  disconnect-interval".length),
                    DiagnosticSeverity.Error, "disconnect-interval type is interval",
                ),
                createDiagnostic(
                    Range.create(9, "  ".length, 9, "  disconnect-interval".length),
                    DiagnosticSeverity.Error, "disconnect-interval type is interval",
                ),
                createDiagnostic(
                    Range.create(11, "  ".length, 11, "  update-interval".length),
                    DiagnosticSeverity.Warning, "Specifying the interval in seconds is deprecated.\n" +
                    "Use `count unit` format, for example: `5 minute`.",
                ),
            ],
        ),
    ];

    tests.forEach((test: Test): void => { test.validationTest(); });
});
