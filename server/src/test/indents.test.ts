import { deepStrictEqual } from "assert";
import { FormattingOptions, Position, Range, TextEdit } from "vscode-languageserver";
import { DEFAULT_FORMATTING_OPTIONS, Formatter } from "../formatter";
import { Test } from "./test";

suite("Formatting indents tests: sections and settings", () => {
  const tests: Test[] = [
    new Test(
      "correct cfg section",
      `[configuration]
  width-units = 200
  height-units = 200`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "incorrect cfg section",
      `[configuration]
width-units = 200
  height-units = 200`,
      [TextEdit.replace(Range.create(Position.create(1, 0), Position.create(1, 0)), "  ")],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "correct nested wgt section",
      `[configuration]
  width-units = 200
  height-units = 200

  [widget]
    type = chart`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "incorrect nested wgt section",
      `[configuration]
  width-units = 200
  height-units = 200

  [widget]
  type = chart`,
      [TextEdit.replace(Range.create(Position.create(5, 0), Position.create(5, 2)), "    ")],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "correct nested series section",
      `[configuration]
  width-units = 200
  height-units = 200

  [widget]
    type = chart

    [series]
      entity = server`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "incorrect nested series section",
      `[configuration]
  width-units = 200
  height-units = 200

  [widget]
    type = chart

  [series]
      entity = server`,
      [TextEdit.replace(Range.create(Position.create(7, 0), Position.create(7, 2)), "    ")],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Correct for loop",
      `[configuration]
  width-units = 200
  height-units = 200

  [widget]
    type = chart
    for server in servers

      [series]
        entity = @{server}
    endfor`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Incorrect for loop",
      `[configuration]
  width-units = 200
  height-units = 200

  [widget]
    type = chart
    for server in servers

      [series]
      entity = @{server}
    endfor`,
      [TextEdit.replace(Range.create(Position.create(9, 0), Position.create(9, "      ".length)), "        ")],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Incorrect nested if in for",
      `
  [widget]
    type = chart
    list servers = vps,
      vds
    endlist
    for item in servers

      [series]
        entity = @{item}
        if @{item} = vps
metric = cpu_busy
        elseif @{item} = vds
metric = cpu_user
        else
metric = cpu_system
        endif
    endfor`,
      [
        TextEdit.replace(Range.create(Position.create(11, 0), Position.create(11, 0)), "          "),
        TextEdit.replace(Range.create(Position.create(13, 0), Position.create(13, 0)), "          "),
        TextEdit.replace(Range.create(Position.create(15, 0), Position.create(15, 0)), "          "),
      ],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Incorrect formatting in the first for, correct in second",
      `
  [widget]
    type = chart
    metric = cpu_busy
    list servers = nurswgvml006,
      nurswgvml007
    endlist
    for server in servers

[series]
    entity = @{server}

[series]
    entity = @{server}
    endfor
    for server in servers

      [series]
        entity = @{server}
        if server == 'nurswgvml007'
          color = red
        elseif server == 'nurswgvml006'
          color = yellow
        endif
    endfor`,
      [
        TextEdit.replace(Range.create(Position.create(9, 0), Position.create(9, 0)), "      "),
        TextEdit.replace(Range.create(Position.create(10, 0), Position.create(10, "    ".length)), "        "),
        TextEdit.replace(Range.create(Position.create(12, 0), Position.create(12, 0)), "      "),
        TextEdit.replace(Range.create(Position.create(13, 0), Position.create(13, "    ".length)), "        "),
      ],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "A couple of correct groups",
      `
[group]

  [widget]
    type = chart

    [series]
      entity = vps
      metric = cpu_busy

  [widget]
    type = chart

    [series]
      entity = vds
      metric = cpu_busy

[group]

  [widget]
    type = chart

    [series]
      entity = vps
      metric = cpu_busy

  [widget]
    type = chart

    [series]
      entity = vds
      metric = cpu_busy`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Correct for after var declaration",
      `
  [widget]
    type = chart
    var servers = [ 'vps', 'vds' ]
    for item in servers

      [series]
        entity = @{item}
        metric = cpu_busy
    endfor`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Adds a space between setting name and equals sign",
      `[configuration]
  entity= cpu_busy`,
      [
        TextEdit.insert(Position.create(1, "  entity".length), " "),
      ],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Align series setting declared after [tags] and empty line",
      `
    [series]
      entity = server
      metric = cpu_busy

      [tags]
        startime = 2018
starttime = 2018`,
      [
        TextEdit.insert(Position.create(7, 0), "        "),
      ],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Removes an extra space between setting name and equals sign",
      `[configuration]
  entity  = cpu_busy`,
      [
        TextEdit.replace(Range.create(1, "  entity".length, 1, "  entity  ".length), " "),
      ],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Adds a space between list name and equals sign",
      `[configuration]
  list entities= entity1, entity2`,
      [
        TextEdit.insert(Position.create(1, "  list entities".length), " "),
      ],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Removes an extra space between list name and equals sign",
      `[configuration]
  list entities  = entity1, entity2`,
      [
        TextEdit.replace(Range.create(1, "  list entities".length, 1, "  list entities  ".length), " "),
      ],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Does not affect equals signs in setting value",
      `[configuration]
  script = var hello= value()`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Incorrect [column] after endfor",
      `[configuration]
  entity = a

[group]

  [widget]
    type = chart

    [column]
      key = value
      label = Count
      list metrics = a, b
      for metric in metrics

        [series]
          metric = @{metric}
      endfor

       [column]
      key = value
      label = Value`,
      [TextEdit.replace(Range.create(Position.create(18, 0), Position.create(18, "       ".length)), "    ")],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "No ident increase after one-line script",
      `script = if (dialog) widget.hideEmptySeries(false)
column-time = null`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "[series] at the same indent as [tags] in [widget]",
      `
  [widget]
    type = chart

    [tags]
      host = *

[series]`,
      [TextEdit.replace(Range.create(Position.create(7, 0), Position.create(7, 0)), "    ")],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "[column] at the same indent as [tags] in [widget]",
      `[configuration]

[group]

  [widget]
    type = console

    [tags]
      "type" = logger

[column]
      key = level`,
      [TextEdit.replace(Range.create(Position.create(10, 0), Position.create(10, 0)), "    ")],
      DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "[dropdown] nested to [widget]",
      `[configuration]

[group]

  [widget]
    entity = e
    type = chart

    [dropdown]
      change-field = metric
      options = javascript: requestEntitiesMetricsOptions('name', 'label')

    [series]`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "[series] at the same indent as [column] and [tags]",
      `[configuration]
  entity = a

[group]

  [widget]
    type = bar

    [column]
      label-format = tags.instance

    [tags]
      instance = *

    [series]
      metric = collectd.df.df_complex.reserved
      color = brown`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "[series] at the same indent as [column] and [tags] (empty line after tags)",
      `[configuration]
  entity = a

[group]

  [widget]
    type = bar

    [column]
      label-format = tags.instance

    [tags]
      instance = *

    [series]
      metric = collectd.df.df_complex.reserved
      color = brown`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "[widget] after [column] and [series]",
      `[configuration]
  entity = a

[group]

  [widget]
    type = bar

    [column]
      column-label-format = tags.instance

    [series]
      metric = collectd.cpu.cpu.wait
      metric-label = wait

  [widget]
    type = chart`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "[column] > [series] > [tags] inside if and for",
      `
[group]

  [widget]
    type = bar
    var sites = getTags("iis.errors", "site", "\${entity}")
    for site in sites
      if site ! = "DefaultWebSite"

        [column]
          label = @{site}

        [series]
          metric = iis.errors

          [tags]
            "type" = locked
            site = @{site}

        [series]
          metric = iis.errors

          [tags]
            "type" = notfound
            site = @{site}
      endif
    endfor`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Two [option] at the same indent",
      `
    [dropdown]
      change-field = series.metric

      [option]
        text = CPU Busy
        value = cpu_busy

      [option]
        text = CPU Idle
        value = cpu_idle`,
      [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Child inside keywords, parent - outside",
      `
    [column]
      key = value
      label = Disk Busy, %
      var f_systems = getTags("nmon.disk_%busy", "id", "\${entity}", "now - 2 * day")
      for id in f_systems
        if id != 'total'

          [series]
            label = @{id}

            [tags]
              name = id
              value = @{id}
        endif
      endfor`,
      [], DEFAULT_FORMATTING_OPTIONS,
    )
  ];
  tests.forEach((test: Test) => { test.formatTest(); }
  );
});

suite("Formatting indents tests: !=, ==, = ", () => {
  const tests: Test[] = [
    new Test(
      "Correct !=",
      `if id != 'a'`, [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Correct ==",
      `if id == 'a'`, [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Correct =",
      `type = bar`, [], DEFAULT_FORMATTING_OPTIONS,
    ), new Test(
      "Incorrect ==",
      `if id =='a'`, [TextEdit.replace(Range.create(
        Position.create(0, "if id ==".length), Position.create(0, "if id ==".length)), " ")],
        DEFAULT_FORMATTING_OPTIONS,
    ), new Test(
      "Incorrect =",
      `type=bar`, [TextEdit.replace(Range.create(
        Position.create(0, "type".length), Position.create(0, "type".length)), " "),
      TextEdit.replace(Range.create(
        Position.create(0, "type=".length), Position.create(0, "type=".length)), " ")
      ],
      DEFAULT_FORMATTING_OPTIONS,
    )];
  tests.forEach((test: Test) => { test.formatTest(); });
});

suite("Formatting indents tests: >=, <=, >, <", () => {
  test("Correct >", () => {
    const text = `if a > b`;
    const options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS;
    const expected: TextEdit[] = [];
    const formatter = new Formatter(text, options);
    const actual = formatter.lineByLine();
    deepStrictEqual(actual, expected);
  });

  test("Correct <", () => {
    const text = `if a < b`;
    const options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS;
    const expected: TextEdit[] = [];
    const formatter = new Formatter(text, options);
    const actual = formatter.lineByLine();
    deepStrictEqual(actual, expected);
  });

  test("Correct >=", () => {
    const text = `if a >= b`;
    const options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS;
    const expected: TextEdit[] = [];
    const formatter = new Formatter(text, options);
    const actual = formatter.lineByLine();
    deepStrictEqual(actual, expected);
  });

  test("Correct <=", () => {
    const text = `if a <= b`;
    const options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS;
    const expected: TextEdit[] = [];
    const formatter = new Formatter(text, options);
    const actual = formatter.lineByLine();
    deepStrictEqual(actual, expected);
  });

  test("Incorrect > (extra spaces before)", () => {
    const text = `if a   > b`;
    const options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS;
    const expected: TextEdit[] = [
      TextEdit.replace(Range.create(
        Position.create(0, "if a".length),
        Position.create(0, "if a   ".length)), " "
      )
    ];
    const formatter = new Formatter(text, options);
    const actual = formatter.lineByLine();
    deepStrictEqual(actual, expected);
  });

  test("Incorrect <= (extra spaces after)", () => {
    const text = `if a <=   b`;
    const options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS;
    const expected: TextEdit[] = [
      TextEdit.replace(Range.create(
        Position.create(0, "if a <=".length),
        Position.create(0, "if a <=   ".length)), " "
      )
    ];
    const formatter = new Formatter(text, options);
    const actual = formatter.lineByLine();
    deepStrictEqual(actual, expected);
  });
});

suite("Formatting indents tests for keywords that can be unclosed", () => {
  const tests: Test[] = [
    new Test(
      "Correct: csv <name> from <url>",
      `csv rows from https://raw.githubusercontent.com/axibase/visa-refusal.csv
for row in rows
endfor`, [], DEFAULT_FORMATTING_OPTIONS,
    ),
    new Test(
      "Incorrect: csv <name> from <url>",
      `csv rows from https://raw.githubusercontent.com/axibase/visa-refusal.csv
  for row in rows
endfor`,
[TextEdit.replace(Range.create(Position.create(1, 0), Position.create(1, "  ".length)), "")],
DEFAULT_FORMATTING_OPTIONS,
    )];
  tests.forEach((test: Test) => { test.formatTest(); }
  );
});
