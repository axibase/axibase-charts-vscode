import { Util } from "language-service/dist";
import { Position, Range } from "vscode-languageserver";
import { Test } from "./test";

suite("Var endvar tests", () => {
    const tests: Test[] = [
        new Test(
            "Correct oneline var array",
            "var v = [[9,3], [9,4]]",
            [],
        ),
        new Test(
            "Correct oneline var props",
            'var v = { "hello": "value", "array": ["val", "value"]}',
            [],
        ),
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
            "Correct multiline var array",
            `var v = [
    [9,3], [9,4]
]
endvar`,
            [],
        ),
        new Test(
            "Incorrect multiline var array",
            `var v = [
    [9,3], [9,4]
]
edvar`,
            [Util.createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "var".length)),
                "var has no matching endvar",
            )],
        ),
        new Test(
            "Incorrect multiline var props",
            `var v = {
   "hello": "value",
   "array": ["val", "value"]
}
edvar`,
            [Util.createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "var".length)),
                "var has no matching endvar",
            )],
        ),
        new Test(
            "Incorrect multiline var mixed array of props",
            `var v = [
   { "hello": "value" },
   { "array": ["val", "value"] }
]
edvar`,
            [Util.createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "var".length)),
                "var has no matching endvar",
            )],
        ),
        new Test(
            "Correct var function call",
            'var v = getEntities("hello")',
            [],
        ),
    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
