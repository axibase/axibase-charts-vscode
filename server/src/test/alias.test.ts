import { Util } from "language-service/dist";
import { Range } from "vscode-languageserver";
import { unknownToken } from "../messageUtil";
import { Test } from "./test";

suite("Incorrect dealias tests", () => {
  const tests: Test[] = [
    new Test(
      "One alias, one correct dealias",
      `[series]
  metric = temp
  entity = srv
  alias = s1
[series]
  metric = temp
  entity = srv
  value = value('s1') * 2`,
      [],
    ),
    new Test(
      "One alias, one incorrect dealias",
      `[series]
  metric = temp
  entity = srv
  alias = s1
[series]
  metric = temp
  entity = srv
  value = value('s2') * 2`,
      [Util.createDiagnostic(
        Range.create(7, "  value = value('".length, 7, "  value = value('".length + "s2".length),
        unknownToken("s2"),
      )],
    ),
    new Test(
      "One alias, one correct dealias before the declaration",
      `[series]
  metric = temp
  entity = srv
  value = value('s1') * 2
[series]
  metric = temp
  entity = srv
  alias = s1`,
      [],
    ),
    new Test(
      "One alias, two incorrect dealiases",
      `[series]
  metric = temp
  entity = srv
  alias = s1
[series]
  metric = temp
  entity = srv
  value = value('s2') * 2
[series]
  metric = temp
  entity = srv
  value = value('s3') * 2`,
      [
        Util.createDiagnostic(
          Range.create(7, "  value = value('".length, 7, "  value = value('".length + "s2".length),
          unknownToken("s2"),
        ),
        Util.createDiagnostic(
          Range.create(11, "  value = value('".length, 11, "  value = value('".length + "s3".length),
          unknownToken("s3"),
        )],
    ),
    new Test(
      "Two aliases, two correct dealiases",
      `[series]
  metric = temp
  entity = srv
  alias = s1
[series]
  metric = temp
  entity = srv
  alias = s2
[series]
  metric = temp
  entity = srv
  value = value('s1') * 2
[series]
  metric = temp
  entity = srv
  value = value('s2') * 2`,
      [],
    ),
    new Test(
      "Two aliases, one incorrect dealias. one correct dealias",
      `[series]
  metric = temp
  entity = srv
  alias = s1
[series]
  metric = temp
  entity = srv
  alias = s2
[series]
  metric = temp
  entity = srv
  value = value('s3') * 2
[series]
  metric = temp
  entity = srv
  value = value('s2') * 2`,
      [Util.createDiagnostic(
        Range.create(11, "  value = value('".length, 11, "  value = value('".length + "s3".length),
        unknownToken("s3"),
      )],
    ),
    new Test(
      "Declared series, indents are used, correct alias and dealias",
      `[series]
  metric = temp
  entity = srv
  alias = src
[series]
  metric = temp
  entity = srv
  value = value('src')`,
      [],
    ),
    new Test(
      "Derived series, indents are used, correct alias and dealias",
      `[series]
  metric = temp
  entity = srv
  alias = src
[series]
  metric = temp
  entity = srv
  alias = free
[series]
  metric = temp
  entity = srv
  value = value('src') - value('free')
[series]
  metric = temp
  entity = srv`,
      [],
    ),
    new Test(
      "Derived series, indents are used, correct alias and incorrect dealias",
      `[series]
  metric = temp
  entity = srv
  alias = src
[series]
  metric = temp
  entity = srv
  alias = free
[series]
  metric = temp
  entity = srv
  value = value('sc') - value('free')
[series]
  metric = temp
  entity = srv`,
      [Util.createDiagnostic(
        Range.create(11, "  value = value('".length, 11, "  value = value('".length + "sc".length),
        unknownToken("sc"),
      )],
    ),
    new Test(
      "Two de-aliases per string without spaces",
      `[series]
  entity = @{server}
  metric = cpu_busy
  alias = avail_cpu_pool

[series]
  entity = @{server}
  metric = cpu_busy
  alias = cpu_total

[series]
  entity = @{server}
  value = (value('avail_cpu_pool')*100)/(value('cpu_total'))`,
      [],
    ),
    new Test(
      "Alias of previously declared series",
      `[widget]
  type = bar
  entity  = 123
  [series]
    metric = linux.disk.fs.space_used
    alias = used
  [series]
    metric = linux.disk.fs.space_free
    alias = free
    alert-expression = value('free')/value('used') < 0.1/0.9

[group]
  [widget]
    type = table
  [widget]
    type = property`,
      [],
    ),
  ];

  tests.forEach((test: Test) => { test.validationTest(); });

});
