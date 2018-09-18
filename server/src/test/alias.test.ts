/* tslint:disable:no-magic-numbers */
import { DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic, errorMessage } from "../util";
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
      [createDiagnostic(
        Range.create(7, "  value = value('".length, 7, "  value = value('".length + "s2".length),
        DiagnosticSeverity.Error, errorMessage("s2", "s1"),
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
        createDiagnostic(
          Range.create(7, "  value = value('".length, 7, "  value = value('".length + "s2".length),
          DiagnosticSeverity.Error, errorMessage("s2", "s1"),
        ),
        createDiagnostic(
          Range.create(11, "  value = value('".length, 11, "  value = value('".length + "s3".length),
          DiagnosticSeverity.Error, errorMessage("s3", "s1"),
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
      [createDiagnostic(
        Range.create(11, "  value = value('".length, 11, "  value = value('".length + "s3".length),
        DiagnosticSeverity.Error, errorMessage("s3", "s1"),
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
      [createDiagnostic(
        Range.create(11, "  value = value('".length, 11, "  value = value('".length + "sc".length),
        DiagnosticSeverity.Error, errorMessage("sc", "src"),
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
  ];

  tests.forEach((test: Test) => { test.validationTest(); });

});
