import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { settingsWithWhitespaces, unknownToken } from "../messageUtil";
import { createDiagnostic } from "../util";
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
                    unknownToken("startime"),
                ),

            ],
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
                    Range.create(Position.create(3, "	".length), Position.create(3, " ".length + "startime".length)),
                    unknownToken("startime"),
                )
            ],
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
                unknownToken("startime"),
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
            "Column setting",
            `[widget]
  type = table
  column-metric = null
  column-value = null`,
            [],
        ),
        new Test(
            "Unclosed section tag",
            `[series
entity = nurswgvml006
metric = cpu_iowait`,
            [createDiagnostic(
                Range.create(0, "[".length, 0, "[".length + "series".length),
                "Section tag is unclosed",
            )],
        ),
        new Test(
            "Correct: no errors about spaces and custom names in settings of [property]",
            `[properties]
            Data Center = Cuperito
            Site = California
            Function = SAP DB`,
            [],
        ),
    ];

    tests.forEach((test: Test) => {
        test.validationTest();
    });

});

suite("Warn about setting that contains whitespaces", () => {
    const settingsName: string = "vertical grid";
    const expectedDiagnostic: Diagnostic = createDiagnostic(
        Range.create(
            Position.create(2, 0),
            Position.create(2, settingsName.length)),
        settingsWithWhitespaces(settingsName), DiagnosticSeverity.Warning);
    [
        new Test("should warn about setting with whitespaces",
                 `[configuration]
                 display-ticks = true
vertical grid = true
max-range = 100
            `,   [expectedDiagnostic],
        ),
    ].forEach((test: Test) => test.validationTest());
});
