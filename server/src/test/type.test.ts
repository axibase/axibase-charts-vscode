import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

function intervalError_1(name: string, example: string): string {
    return `${name} should be set as \`count unit\`.
For example, ${example}. Supported units:\n * nanosecond\n * millisecond\n * second
 * minute\n * hour\n * day\n * week\n * month\n * quarter\n * year`;
}

function intervalError_2(): string {
    return `Specifying the interval in seconds is deprecated.
Use \`count unit\` format.
For example, 5 minute. Supported units:\n * nanosecond\n * millisecond\n * second
 * minute\n * hour\n * day\n * week\n * month\n * quarter\n * year`;
}

function intervalError_3(): string {
    return `Use auto or \`count unit\` format.
For example, 15 minute. Supported units:\n * nanosecond\n * millisecond\n * second
 * minute\n * hour\n * day\n * week\n * month\n * quarter\n * year`;
}

function satisticsError_1(name: string): string {
    return `${name} must be one of:\n * avg\n * count\n * counter\n * delta\n * first\n * last\n * max
 * max_value_time\n * median\n * min\n * min_value_time\n * percentile_{num}
 * standard_deviation\n * sum\n * threshold_count\n * threshold_duration\n * threshold_percent\n * wavg\n * wtavg`;
}

function satisticsError_2(name: string): string {
    return `${name} must be one of:\n * avg\n * count\n * counter\n * delta\n * first
 * last\n * max\n * max_value_time\n * median\n * min\n * min_value_time\n * percentile_{num}
 * standard_deviation\n * sum\n * threshold_count\n * threshold_duration\n * threshold_percent\n * wavg\n * wtavg`;
}

function satisticsError_3(name: string): string {
    return `${name} must be one of:\n * avg\n * count\n * last\n * max\n * median\n * min\n * percentile_{num}\n * sum`;
}

function satisticsError_4(name: string): string {
    return `${name} must be one of:\n * avg\n * count\n * counter\n * delta\n * detail
 * first\n * last\n * max\n * max_value_time\n * median\n * min\n * min_value_time\n * percentile_{num}
 * standard_deviation\n * sum\n * threshold_count\n * threshold_duration\n * threshold_percent\n * wavg\n * wtavg`;
}

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
                    "add-meta should be a boolean value. For example, true",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  add-meta".length),
                    "add-meta should be a boolean value. For example, true",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  add-meta".length),
                    "add-meta should be a boolean value. For example, true",
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
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(9, "  ".length, 9, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(11, "  ".length, 11, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(13, "  ".length, 13, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(15, "  ".length, 15, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(17, "  ".length, 17, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(19, "  ".length, 19, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
                ),
                createDiagnostic(
                    Range.create(21, "  ".length, 21, "  arrow-length".length),
                    "arrow-length should be a real (floating-point) number. For example, 0.3",
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
                    "bottom-axis must be one of:\n * none\n * percentiles\n * values",
                ),
                createDiagnostic(
                    Range.create(2, "  ".length, 2, "  buttons".length),
                    "buttons must be one of:\n * menu\n * update",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  case".length),
                    "case must be one of:\n * lower\n * upper",
                ),
                createDiagnostic(
                    Range.create(4, "  ".length, 4, "  counter-position".length),
                    "counter-position must be one of:\n * bottom\n * none\n * top",
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
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(9, "  ".length, 9, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(11, "  ".length, 11, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(13, "  ".length, 13, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(15, "  ".length, 15, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(17, "  ".length, 17, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(19, "  ".length, 19, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(21, "  ".length, 21, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(23, "  ".length, 23, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(25, "  ".length, 25, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(27, "  ".length, 27, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(29, "  ".length, 29, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(31, "  ".length, 31, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(33, "  ".length, 33, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(35, "  ".length, 35, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(37, "  ".length, 37, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(39, "  ".length, 39, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(41, "  ".length, 41, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
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
  disconnect-interval = auto
[configuration]
  update-interval = 10`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  disconnect-interval".length),
                    intervalError_1("disconnect-interval", "1 minute"),
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  disconnect-interval".length),
                    intervalError_1("disconnect-interval", "1 minute"),
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  disconnect-interval".length),
                    intervalError_1("disconnect-interval", "1 minute"),
                ),
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  disconnect-interval".length),
                    intervalError_1("disconnect-interval", "1 minute"),
                ),
                createDiagnostic(
                    Range.create(9, "  ".length, 9, "  disconnect-interval".length),
                    intervalError_1("disconnect-interval", "1 minute"),
                ),
                createDiagnostic(
                    Range.create(11, "  ".length, 11, "  disconnect-interval".length),
                    intervalError_1("disconnect-interval", "1 minute"),
                ),
                createDiagnostic(
                    Range.create(13, "  ".length, 13, "  update-interval".length),
                    intervalError_2(), DiagnosticSeverity.Warning,
                ),
            ],
        ),
        new Test(
            "Allow \${} and @{} expressions",
            `[configuration]
  	endtime = \${setEndTime}
  list times = 2018, 2019
  for time in times
    start-time = @{time}
  endfor
  `,
            [],
        ),
        new Test(
            "Allow detail statistic",
            `[series]
  entity = test
  metric = test
  statistic = detail`,
            [],
        ),
        new Test(
            "Forbid unknown aggregator in statistic setting",
            `[series]
  entity = test
  metric = test
  statistic = unknown-aggregator`,
            [
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  ".length + "statistic".length),
                    satisticsError_4("statistic"),
                ),
            ],
        ),
        new Test(
            "Allow summarize-statistic last",
            `[configuration]
  summarize-statistic = last`,
            [],
        ),
        new Test(
            "Allow any percentile number in statistic settings",
            `[configuration]
  group-statistic = percentile(25.5)
[configuration]
  statistic = percentile_255
[configuration]
  statistic = percentile_120
[configuration]
  statistics = percentile(10)
[configuration]
  statistics = percentile_10
[configuration]
  statistics = percentile(5)
[configuration]
  summarize-statistic = percentile_5`,
            [],
        ),
        new Test(
            "Incorrect percentile is used",
            `[configuration]
  group-statistic = percentile_-5
[configuration]
  statistic = percentile_-76
[configuration]
  statistics = percentile(-3)
[configuration]
  summarize-statistic = percentile(-93)
[configuration]
  group-statistic = percentile(120)
[configuration]
  group-statistic = percentile(a word)
[configuration]
  summarize-statistic = percentile_word
[configuration]
  statistics = percentile("a word")`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  ".length + "group-statistic".length),
                    satisticsError_2("group-statistic"),
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  ".length + "statistic".length),
                    satisticsError_4("statistic"),
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  ".length + "statistics".length),
                    satisticsError_1("statistics"),
                ),
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  ".length + "summarize-statistic".length),
                    satisticsError_3("summarize-statistic"),
                ),
                createDiagnostic(
                    Range.create(9, "  ".length, 9, "  ".length + "group-statistic".length),
                    satisticsError_2("group-statistic"),
                ),
                createDiagnostic(
                    Range.create(11, "  ".length, 11, "  ".length + "group-statistic".length),
                    satisticsError_2("group-statistic"),
                ),
                createDiagnostic(
                    Range.create(13, "  ".length, 13, "  ".length + "summarize-statistic".length),
                    satisticsError_3("summarize-statistic"),
                ),
                createDiagnostic(
                    Range.create(15, "  ".length, 15, "  ".length + "statistics".length),
                    satisticsError_1("statistics"),
                ),
            ],
        ),
        new Test(
            "Allow auto interval for period, summarize-period, group-period",
            `[configuration]
  period = auto
  summarize-period = auto
  group-period = auto`,
            [],
        ), new Test("Spaces before and after the sign are absent",
            `[configuration]
  add-meta=not-a-boolean-value
  zoom-svg=not-a-number-value
  widgets-per-row=not-an-interger-value
  start-time=not-a-date-value
  period=not-an-interval-value
  source=not-an-enum-value`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  add-meta".length),
                    "add-meta should be a boolean value. For example, true",
                ),
                createDiagnostic(
                    Range.create(2, "  ".length, 2, "  zoom-svg".length),
                    "zoom-svg should be a real (floating-point) number. For example, 1.2",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  widgets-per-row".length),
                    "widgets-per-row should be an integer number. For example, 3",
                ),
                createDiagnostic(
                    Range.create(4, "  ".length, 4, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  period".length),
                    intervalError_3(),
                ),
                createDiagnostic(
                    Range.create(6, "  ".length, 6, "  source".length), "source must be one of:\n * alert\n * message",
                ),
            ],
        ),
        new Test(
            "Space between name and sign is absent, several spaces after sign are present",
            `[configuration]
  add-meta=  not-a-boolean-value
  zoom-svg=  not-a-number-value
  widgets-per-row=  not-an-interger-value
  start-time=  not-a-date-value
  period=  not-an-interval-value
  source=  not-an-enum-value`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  add-meta".length),
                    "add-meta should be a boolean value. For example, true",
                ),
                createDiagnostic(
                    Range.create(2, "  ".length, 2, "  zoom-svg".length),
                    "zoom-svg should be a real (floating-point) number. For example, 1.2",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  widgets-per-row".length),
                    "widgets-per-row should be an integer number. For example, 3",
                ),
                createDiagnostic(
                    Range.create(4, "  ".length, 4, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  period".length),
                    intervalError_3(),
                ),
                createDiagnostic(
                    Range.create(6, "  ".length, 6, "  source".length), "source must be one of:\n * alert\n * message",
                ),
            ],
        ),
        new Test(
            "Space between name and sign is present, space after sign is absent",
            `[configuration]
  add-meta =not-a-boolean-value
  zoom-svg =not-a-number-value
  widgets-per-row =not-an-interger-value
  start-time =not-a-date-value
  period =not-an-interval-value
  source =not-an-enum-value`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  add-meta".length),
                    "add-meta should be a boolean value. For example, true",
                ),
                createDiagnostic(
                    Range.create(2, "  ".length, 2, "  zoom-svg".length),
                    "zoom-svg should be a real (floating-point) number. For example, 1.2",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  widgets-per-row".length),
                    "widgets-per-row should be an integer number. For example, 3",
                ),
                createDiagnostic(
                    Range.create(4, "  ".length, 4, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  period".length),
                    intervalError_3(),
                ),
                createDiagnostic(
                    Range.create(6, "  ".length, 6, "  source".length), "source must be one of:\n * alert\n * message",
                ),
            ],
        ),
        new Test(
            "Several spaces between name and sign are present, space after sign is absent",
            `[configuration]
  add-meta   =not-a-boolean-value
  zoom-svg   =not-a-number-value
  widgets-per-row   =not-an-interger-value
  start-time   =not-a-date-value
  period   =not-an-interval-value
  source   =not-an-enum-value`,
            [
                createDiagnostic(
                    Range.create(1, "  ".length, 1, "  add-meta".length),
                    "add-meta should be a boolean value. For example, true",
                ),
                createDiagnostic(
                    Range.create(2, "  ".length, 2, "  zoom-svg".length),
                    "zoom-svg should be a real (floating-point) number. For example, 1.2",
                ),
                createDiagnostic(
                    Range.create(3, "  ".length, 3, "  widgets-per-row".length),
                    "widgets-per-row should be an integer number. For example, 3",
                ),
                createDiagnostic(
                    Range.create(4, "  ".length, 4, "  start-time".length),
                    "start-time should be a date. For example, 2017-04-01T10:15:00Z",
                ),
                createDiagnostic(
                    Range.create(5, "  ".length, 5, "  period".length),
                    intervalError_3(),
                ),
                createDiagnostic(
                    Range.create(6, "  ".length, 6, "  source".length), "source must be one of:\n * alert\n * message",
                ),
            ],
        ),
        new Test(
            "An error is not raised when a setting name or value is concatenated with equals sign",
            `[configuration]
  add-meta=true
  zoom-svg=5.4
  widgets-per-row=5
  start-time=2018-07-08
  period=15 second
  source=message
[configuration]
  add-meta= true
  zoom-svg= 5.4
  widgets-per-row= 5
  start-time= 2018-07-08
  period= 15 second
  source= message
[configuration]
  add-meta =true
  zoom-svg =5.4
  widgets-per-row =5
  start-time =2018-07-08
  period =15 second
  source =message`,
            [],
        ),
        new Test(
            "An error is raised if setting value is not valid in current scope",
            `[configuration]
[group]
[widget]
  type = console
  class = terminal
[widget]
  type = box
  class = terminal
            `,
            [
                createDiagnostic(
                    Range.create(7, "  ".length, 7, "  class".length), "class must be one of:\n * metro",
                ),
            ],
        ),
        new Test(
            "Incorrect: empty settings are not allowed",
            `type = console
class =
entity =`,
            [
                createDiagnostic(
                    Range.create(1, 0, 1, "class".length), "class must be one of:\n * terminal",
                ),
                createDiagnostic(
                    Range.create(2, 0, 2, "entity".length), "entity can not be empty",
                )
            ]
        ),
        new Test(
            "Correct: horizontal-grid = density for \"histogram\"",
            `type = histogram
            horizontal-grid = density`, []
        ),
        new Test(
            "Correct: horizontal-grid = false for \"chart\"",
            `type = chart
            horizontal-grid = false`, []
        ),
        new Test(
            "incorrect: horizontal-grid = frequency for \"chart\"",
            `type = chart
horizontal-grid = frequency`, [createDiagnostic(
                Range.create(1, 0, 1, "horizontal-grid".length), "horizontal-grid must be one of:\n * false\n * true",
            )]
        ),
        new Test(
            "incorrect: horizontal-grid = true for \"histogram\"",
            `type = histogram
horizontal-grid = true`, [createDiagnostic(
                Range.create(1, 0, 1, "horizontal-grid".length),
                "horizontal-grid must be one of:\n * density\n * false\n * fractions\n * frequency\n * none",
            )]
        )
    ];

    tests.forEach((test: Test): void => { test.validationTest(); });
});
