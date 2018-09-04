/* tslint:disable:no-magic-numbers */
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic, errorMessage } from "../util";
import { Test } from "./test";

suite("Spelling checks", () => {
    const tests: Test[] = [
        new Test(
            "starttime",
            `[configuration]
	start-time = 2018
	startime = 2018`,
            [
                createDiagnostic(
                    Range.create(Position.create(2, "	".length), Position.create(2, "	startime".length)),
                    DiagnosticSeverity.Error, errorMessage("startime", "start-time"),
                ),

            ],
        ),
        new Test(
            "section eries",
            `[eries]
	starttime = 2018`,
            [createDiagnostic(
                Range.create(Position.create(0, "[".length), Position.create(0, "[eries".length)),
                DiagnosticSeverity.Error, errorMessage("eries", "series"),
            )],
        ),
        new Test(
            "section starttime",
            `[starttime]
	starttime = 2018`,
            [createDiagnostic(
                Range.create(Position.create(0, "[".length), Position.create(0, "[starttime".length)),
                DiagnosticSeverity.Error, errorMessage("starttime", "series"),
            )],
        ),
        new Test(
            "tags ignored",
            `[tags]
	startime = 2018`,
            [],
        ),
        new Test(
            "tags ignoring finished with new section",
            `[tags]
	startime = 2018
[starttime]
	startime = 2018`,
            [
                createDiagnostic(
                    Range.create(Position.create(2, "[".length), Position.create(2, "[starttime".length)),
                    DiagnosticSeverity.Error, errorMessage("starttime", "series"),
                ),
                createDiagnostic(
                    Range.create(Position.create(3, "	".length), Position.create(3, " ".length + "startime".length)),
                    DiagnosticSeverity.Error, errorMessage("startime", "start-time"),
                )],
        ),
        new Test(
            "tags ignoring finished with whitespace",
            `[series]
  entity = server
  metric = cpu_busy
  [tags]
    startime = 2018

  startime = 2018`,
            [createDiagnostic(
                Range.create(Position.create(6, "  ".length), Position.create(6, "  ".length + "startime".length)),
                DiagnosticSeverity.Error, errorMessage("startime", "start-time"),
            )],
        ),
        new Test(
            "Space after section name",
            // tslint:disable-next-line:no-trailing-whitespace
            `[widget] 
type = chart`,
            [],
        ),
        new Test(
            "Space before section name",
            ` [widget]
type = chart`,
            [],
        ),
        new Test(
            "Placeholders section contains valid items  ",
            `url-parameters = ?queryName=EVTNOT&id=\${id}&sd=\${sd}&ed=\${ed}
[placeholders]
  id = none
  sd = 0
  ed = 0`,
            [],
        ),
        new Test(
            "Placeholders section contains invalid items  ",
            `url-parameters = ?queryName=EVTNOT&id=\${id}&sd=\${sd}&ed=\${ed}
[placeholders]
  id = none
  ad = 0
  ed = 0`,
            [createDiagnostic(
                Range.create(Position.create(3, "  ".length), Position.create(3, "  ".length + "ad".length)),
                DiagnosticSeverity.Error, errorMessage("ad", "id"),
            )],
        ),
        new Test(
            "Column setting",
            `[widget]
  type = table
  column-metric = null
  column-value = null`,
            [],
        ),
    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
