import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { dateError, supportedUnits } from "../messageUtil";
import { createDiagnostic, createRange } from "../util";
import { Validator } from "../validator";
import { Test } from "./test";

function intervalError_1(name: string, example: string): string {
  return `${name} should be set as \`count unit\`.
For example, ${example}. ${supportedUnits()}`;
}

function intervalError_2(): string {
  return `Specifying the interval in seconds is deprecated.
Use \`count unit\` format.
For example, 5 minute. ${supportedUnits()}`;
}

function intervalError_3(): string {
  return `Use auto or \`count unit\` format.
For example, 15 minute. ${supportedUnits()}`;
}

function satisticsError(name: string): string {
  return `${name} must be one of:\n * avg\n * count\n * counter\n * delta\n * detail
 * first\n * last\n * max\n * max_value_time\n * median\n * min\n * min_value_time\n * percentile(n)
 * standard_deviation\n * sum\n * threshold_count\n * threshold_duration\n * threshold_percent\n * wavg\n * wtavg`;
}

function percentileError(current: string): string {
  return `n must be a decimal number between [0, 100]. Current: ${current}`;
}

const arrowLengthMsg = "arrow-length should be a real (floating-point) number. For example, 0.3, 30%";

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
  font-scale = 0
[configuration]
  downsample-ratio = 1
[configuration]
  default-size = 2
[configuration]
  arrow-length = .3
[configuration]
  arrow-length = 0.3
[configuration]
  arrow-length = 0.333333333
[configuration]
  arrow-length = 30%
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
          Range.create(1, "  ".length, 1, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(3, "  ".length, 3, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(5, "  ".length, 5, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(7, "  ".length, 7, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(9, "  ".length, 9, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(11, "  ".length, 11, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(13, "  ".length, 13, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(15, "  ".length, 15, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(17, "  ".length, 17, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(19, "  ".length, 19, "  arrow-length".length), arrowLengthMsg
        ),
        createDiagnostic(
          Range.create(21, "  ".length, 21, "  arrow-length".length), arrowLengthMsg
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
`,
      [],
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
          satisticsError("statistic"),
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
      "Allow percentile number in [0,100] for statistic settings",
      `[configuration]
  group-statistic = percentile(100)
[configuration]
  statistic = percentile(25.5)
[configuration]
  summarize-statistic = percentile(0)`,
      [],
    ),
    new Test(
      "Incorrect percentile is used",
      `[configuration]
  group-statistic = percentile(-5)
[configuration]
  statistic = percentile(-0.1)
[configuration]
  summarize-statistic = percentile(100.1)
[configuration]
  group-statistic = percentile(a word)
[configuration]
  summarize-statistic = percentile(word)
[configuration]
  statistics = percentile("a word")`,
      [
        createDiagnostic(
          Range.create(1, "  ".length, 1, "  ".length + "group-statistic".length),
          percentileError("-5"),
        ),
        createDiagnostic(
          Range.create(3, "  ".length, 3, "  ".length + "statistic".length),
          percentileError("-0.1"),
        ),
        createDiagnostic(
          Range.create(5, "  ".length, 5, "  ".length + "summarize-statistic".length),
          percentileError("100.1"),
        ),
        createDiagnostic(
          Range.create(7, "  ".length, 7, "  ".length + "group-statistic".length),
          percentileError("a wo"),
        ),
        createDiagnostic(
          Range.create(9, "  ".length, 9, "  ".length + "summarize-statistic".length),
          percentileError("wo"),
        ),
        createDiagnostic(
          Range.create(11, "  ".length, 11, "  ".length + "statistics".length),
          percentileError("\"a wo"),
        )
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
          Range.create(4, "  ".length, 4, "  period".length),
          intervalError_3(),
        ),
        createDiagnostic(
          Range.create(5, "  ".length, 5, "  source".length),
          "source must be one of:\n * alert\n * message",
        ),
      ],
    ),
    new Test(
      "Space between name and sign is absent, several spaces after sign are present",
      `[configuration]
  add-meta=  not-a-boolean-value
  zoom-svg=  not-a-number-value
  widgets-per-row=  not-an-interger-value
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
          Range.create(4, "  ".length, 4, "  period".length),
          intervalError_3(),
        ),
        createDiagnostic(
          Range.create(5, "  ".length, 5, "  source".length),
          "source must be one of:\n * alert\n * message",
        ),
      ],
    ),
    new Test(
      "Space between name and sign is present, space after sign is absent",
      `[configuration]
  add-meta =not-a-boolean-value
  zoom-svg =not-a-number-value
  widgets-per-row =not-an-interger-value
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
          Range.create(4, "  ".length, 4, "  period".length),
          intervalError_3(),
        ),
        createDiagnostic(
          Range.create(5, "  ".length, 5, "  source".length),
          "source must be one of:\n * alert\n * message",
        ),
      ],
    ),
    new Test(
      "Several spaces between name and sign are present, space after sign is absent",
      `[configuration]
  add-meta   =not-a-boolean-value
  zoom-svg   =not-a-number-value
  widgets-per-row   =not-an-interger-value
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
          Range.create(4, "  ".length, 4, "  period".length),
          intervalError_3(),
        ),
        createDiagnostic(
          Range.create(5, "  ".length, 5, "  source".length),
          "source must be one of:\n * alert\n * message",
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
      "Correct: horizontal-grid = density for histogram",
      `type = histogram
            horizontal-grid = density`, []
    ),
    new Test(
      "Correct: horizontal-grid = false for chart",
      `type = chart
            horizontal-grid = false`, []
    ),
    new Test(
      "Incorrect: horizontal-grid = frequency for chart",
      `type = chart
horizontal-grid = frequency`, [createDiagnostic(
        Range.create(1, 0, 1, "horizontal-grid".length), "horizontal-grid must be one of:\n * false\n * true",
      )]
    ),
    new Test(
      "Incorrect: horizontal-grid = true for histogram",
      `type = histogram
horizontal-grid = true`, [createDiagnostic(
        Range.create(1, 0, 1, "horizontal-grid".length),
        "horizontal-grid must be one of:\n * density\n * false\n * fractions\n * frequency\n * none",
      )]
    )
  ];

  tests.forEach((test: Test): void => { test.validationTest(); });
});

import * as assert from "assert";

suite("Incorrect date setting", () => {
  function buildExpectedDiagnostic(specificMsg: string): Diagnostic[] {
    return [
      createDiagnostic(createRange(0, "start-time".length, 1),
        dateError(specificMsg, "start-time"))];
  }

  function buildConfig(template: string) {
    return `[configuration]
start-time = ${template}
  [group]
    [widget]
      type = chart
      [series]
        entity = a
        metric = b`;
  }

  test("1969", () => {
    const template = "1969";
    const config = buildConfig(template);
    const validator = new Validator(config);
    const expected = buildExpectedDiagnostic(
      "Date must be greater than 1970-01-01 00:00:00: " + template);
    const actual = validator.lineByLine();
    assert.deepStrictEqual(actual, expected, `Config:\n${config}`);
  });
  test("2018-12-31T15:43:32U", () => {
    const template = "2018-12-31T15:43:32U";
    const config = buildConfig(template);
    const validator = new Validator(config);
    const expected = buildExpectedDiagnostic(
      "Incorrect time template: 2018-12-31t15:43:32u");
    const actual = validator.lineByLine();
    assert.deepStrictEqual(actual, expected, `Config:\n${config}`);
  });
  test("previos_week", () => {
    const template = "previos_week";
    const config = buildConfig(template);
    const validator = new Validator(config);
    const expected = buildExpectedDiagnostic(
      "Incorrect time template: previos_week");
    const actual = validator.lineByLine();
    assert.deepStrictEqual(actual, expected, `Config:\n${config}`);
  });
  test(".5 * week", () => {
    const template = "current_month + .5 * week";
    const config = buildConfig(template);
    const validator = new Validator(config);
    const expected = buildExpectedDiagnostic(
      "Incorrect interval syntax: + .5 * week");
    const actual = validator.lineByLine();
    assert.deepStrictEqual(actual, expected, `Config:\n${config}`);
  });
});
