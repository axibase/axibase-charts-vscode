import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("[JS] Var content tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct oneline var array",
            "var v = [[9,3], [9,4]]",
            [],
        ),
        new Test(
            "Correct oneline var empty array",
            "var v = []",
            [],
        ),
        new Test(
            "Correct oneline var empty object",
            "var v = {}",
            [],
        ),
        new Test(
            "Correct oneline var props",
            'var v = { "hello": "value", "array": ["val", "value"]}',
            [],
        ),
        new Test(
            "Correct oneline var with function call",
            "var offsets = range(2,6)", []),
        new Test(
            "Correct oneline var without emty string after",
            `[widget]
            var ff = []
            type = chart`, []),
        new Test(
            "Correct multiline var props",
            `var v = {
   "hello": "value",
   "array": ["val", "value"]
}
endvar`,
            [],
        ),
        new Test(
            "Correct multiline var multiarray",
            `var v = [
[9,3], [9,4]
]
endvar`,    []),
        new Test(
            "Correct multiline var array",
            `  var a = ["abc"
]
endvar`,    []),
        new Test(
            "Correct multiline var arrays with different types",
            `var v = [
["abc"],
[1],,,
]
endvar

var c = [["abc"],
  [1,2,3]
]
endvar`,    []),
        new Test(
            "Incorrect multiline var array: unexpected variable",
            `var v = [
    abc
]
endvar`,
            [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(2, "var v = [".length)),
                "abc is not defined", DiagnosticSeverity.Warning,
            )],
        ),
        new Test(
            "Incorrect multiline var array: no closing bracket",
            `var v = [
"abc"
endvar`,    [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(1, "var v = [".length)),
                "Unexpected token }", DiagnosticSeverity.Warning,
            )],
        ),
        new Test(
            "Incorrect oneline var: no opening bracket",
            "var v = ]", [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "var v = ]".length)),
                "Unexpected token ]", DiagnosticSeverity.Warning,
            )],
        ),
    ];

    tests.forEach((test: Test) => { test.jsValidationTest(); });

});
