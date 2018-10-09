import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("[JS] Script content tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct one-line script",
            `script = console.log()`,
            [],
        ),
        new Test(
            "Correct var reference",
            `var cmdb = {
"agent1": {"Region": "abc"}
}
endvar
script
cmdb = @{JSON.stringify(cmdb)}
endscript`,
            [],
        ),
        new Test(
            "Correct function declaration and call",
            `script
            window.numberToDate = function (n) {
            var di = Math.round(n*1)+"";
            return new Date(di.substring(0,4), di.substring(4,6),` +
            `di.substring(6,8), di.substring(8,10), di.substring(10,12), di.substring(12,14));
            };
          endscript
          replace-value = numberToDate(value)`,
            [],
        ),
        new Test(
            "Correct function using: called earlier than declared",
            `replace-value = dateToNumber(value)
            script
            window.dateToNumber = function (ms) {
               var utc = new Date(ms).toISOString();
               return utc.substring(0, 4) + utc.substring(5, 7) + utc.substring(8, 10)` +
            ` + utc.substring(11, 13) + utc.substring(14, 16) + utc.substring(17, 19);
            };
          endscript`,
            [],
        ),
        new Test(
            "Correct csv reference",
            `csv index =
            president,inauguration
            GeraldFord, 1974
          endcsv
          
          script
            window.indexMap = (function () {
            var map = {};
            var idx = @{JSON.stringify(index)};
            for (var i = 0; i < idx.length; i++) {
              map[idx[i].president] = idx[i].inauguration;
              }
              return map;
              })()
            endscript`,
            [],
        ),
        new Test(
            "Incorrect one-line script",
            `script = console.og()`,
            [createDiagnostic(
                Range.create(Position.create(0, "script = ".length),
                    Position.create(0, "script = console.og()".length)),
                "console.og is not a function", DiagnosticSeverity.Warning,
            )],
        ),
        new Test(
            "Incorrect var reference",
            `var cmdb = {
"agent1": {"Region": "abc"}
}
endvar
script
cmdb = @{JSON.stringify(mdb)}
endscript`,
            [createDiagnostic(
                Range.create(Position.create(5, 0), Position.create(5, "cmdb = @{JSON.stringify(mdb)}".length)),
                "mdb is not defined", DiagnosticSeverity.Warning,
            )],
        )
    ];

    tests.forEach((test: Test) => { test.jsValidationTest(); });

});
