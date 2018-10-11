import { FormattingOptions, Position, Range, TextEdit } from "vscode-languageserver";
import { Test } from "./test";

suite("Formatting indents tests", () => {
    const tests: Test[] = [
        new Test(
            "correct cfg section",
            `[configuration]
  width-units = 200
  height-units = 200`,
            [], FormattingOptions.create(2, true),
        ),
        new Test(
            "incorrect cfg section",
            `[configuration]
width-units = 200
  height-units = 200`,
            [TextEdit.replace(Range.create(Position.create(1, 0), Position.create(1, 0)), "  ")],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "correct nested wgt section",
            `[configuration]
  width-units = 200
  height-units = 200
  [widget]
    type = chart`,
            [], FormattingOptions.create(2, true),
        ),
        new Test(
            "incorrect nested wgt section",
            `[configuration]
  width-units = 200
  height-units = 200
  [widget]
  type = chart`,
            [TextEdit.replace(Range.create(Position.create(4, 0), Position.create(4, 2)), "    ")],
            FormattingOptions.create(2, true),
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
            [], FormattingOptions.create(2, true),
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
            [TextEdit.replace(Range.create(Position.create(5, 0), Position.create(5, 2)), "    ")],
            FormattingOptions.create(2, true),
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
            [], FormattingOptions.create(2, true),
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
            [TextEdit.replace(Range.create(Position.create(7, 0), Position.create(7, "      ".length)), "        ")],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "Incorrect nested if in for",
            `list servers = vps,
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
                TextEdit.replace(Range.create(Position.create(7, 0), Position.create(7, "    ".length)), "      "),
                TextEdit.replace(Range.create(Position.create(9, 0), Position.create(9, "    ".length)), "      "),
                TextEdit.replace(Range.create(Position.create(11, 0), Position.create(11, "    ".length)), "      "),
            ],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "Incorrect formatting in the first for, correct in second",
            `[widget]
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
                TextEdit.replace(Range.create(Position.create(9, 0), Position.create(9, 0)), "    "),
                TextEdit.replace(Range.create(Position.create(10, 0), Position.create(10, "    ".length)), "      "),
                TextEdit.replace(Range.create(Position.create(12, 0), Position.create(12, 0)), "    "),
                TextEdit.replace(Range.create(Position.create(13, 0), Position.create(13, "    ".length)), "      "),
            ],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "A couple of correct groups",
            `[group]
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
            [], FormattingOptions.create(2, true),
        ),
        new Test(
            "Correct for after var declaration",
            `[widget]
  type = chart

  var servers = [ 'vps', 'vds' ]

  for item in servers
    [series]
      entity = @{item}
      metric = cpu_busy
  endfor`,
            [], FormattingOptions.create(2, true),
        ),
        new Test(
            "Adds a space between setting name and equals sign",
            `[configuration]
  entity= cpu_busy`,
            [
                TextEdit.insert(Position.create(1, "  entity".length), " "),
            ],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "Align series setting declared after [tags] and empty line",
            `[series]
  entity = server
  metric = cpu_busy
  [tags]
    startime = 2018

starttime = 2018`,
            [
                TextEdit.insert(Position.create(6, 0), "  "),
            ],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "Removes an extra space between setting name and equals sign",
            `[configuration]
  entity  = cpu_busy`,
            [
                TextEdit.replace(Range.create(1, "  entity".length, 1, "  entity  ".length), " "),
            ],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "Adds a space between list name and equals sign",
            `[configuration]
  list entities= entity1, entity2`,
            [
                TextEdit.insert(Position.create(1, "  list entities".length), " "),
            ],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "Removes an extra space between list name and equals sign",
            `[configuration]
  list entities  = entity1, entity2`,
            [
                TextEdit.replace(Range.create(1, "  list entities".length, 1, "  list entities  ".length), " "),
            ],
            FormattingOptions.create(2, true),
        ),
        new Test(
            "Does not affect equals signs in setting value",
            `[configuration]
  script = var hello= value()`,
            [], FormattingOptions.create(2, true),
        ),
    ];

    tests.forEach((test: Test) => { test.formatTest(); });
});
