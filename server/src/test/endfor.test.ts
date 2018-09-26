import { Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

suite("Unmatched endfor tests", () => {
    const tests: Test[] = [
        new Test(
            "One correct loop",
            `list servers = 'srv1', 'srv2'
for server in servers
   do something
endfor`,
            [],
        ),
        new Test(
            "Two correct loops",
            `list servers = 'srv1', 'srv2'
for server in servers
   do something
endfor
for server in servers
   do something
endfor`,
            [],
        ),
        new Test(
            "One incorrect loop",
            `list servers = 'srv1', 'srv2'
for server in servers
   do something`,
            [createDiagnostic(
                Range.create(Position.create(1, 0), Position.create(1, "for".length)),
                "for has no matching endfor",
            )],
        ),
        new Test(
            "Two incorrect loops",
            `list servers = 'srv1', 'srv2'
for server in servers
   do something
for srv in servers
   do something`,
            [
                createDiagnostic(
                    Range.create(Position.create(1, 0), Position.create(1, "for".length)),
                    "for has no matching endfor",
                ),
                createDiagnostic(
                    Range.create(Position.create(3, 0), Position.create(3, "for".length)),
                    "for has no matching endfor",
                )],
        ),
        new Test(
            "One incorrect loop, one correct loop",
            `list servers = 'srv1', 'srv2'
for server in servers
   do something
for srv in servers
   do something
endfor`,
            [createDiagnostic(
                Range.create(Position.create(1, 0), Position.create(1, "for".length)),
                "for has no matching endfor",
            )],
        ),
    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
