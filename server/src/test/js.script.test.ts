/* import { Position, Range, DiagnosticSeverity } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("[JS] Script content tests", () => {
    const tests: Test[] = [
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
            return new Date(di.substring(0,4), di.substring(4,6), di.substring(6,8), di.substring(8,10), di.substring(10,12), di.substring(12,14));
            };
          endscript`,
            [],
        ),
        new Test(
            "Correct function using: called earlier than declared",
            `    [series]
            entity = nurswgvml007
            metric = cpu_busy
            replace-value = roundToTen(value)      
                script
        window.roundToTen = function (value) {
            return Math.round(value / 10) * 10;
        }
        endscript`,
            [],
        )
    ];

    tests.forEach((test: Test) => { test.jsValidationTest(); });

});
 */