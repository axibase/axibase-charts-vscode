import { Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

const unknownToken: string = "list has no matching endlist";

suite("Unfinished list", () => {
    const tests: Test[] = [
        new Test(
            "One correct oneline list",
            "list servers = vps, vds",
            [],
        ),
        new Test(
            "One correct multiline list",
            `list servers = vps,
  vds
endlist`,
            [],
        ),
        new Test(
            "One incorrect multiline list",
            `list servers = vps,
	vds
edlist`,
            [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "list".length)),
                unknownToken,
            )],
        ),
        new Test(
            "One incorrect multiline list with comment before",
            `/* this is
a comment
to check correct range */

list servers = vps,
	vds
edlist`,
            [createDiagnostic(
                Range.create(Position.create(4, 0), Position.create(4, "list".length)),
                unknownToken,
            )],
        ),
        new Test(
            "One incorrect multiline list with comment on the line",
            `/* test */ list servers = vps,
	vds
edlist`,
            [createDiagnostic(
                Range.create(Position.create(0, "/* test */ ".length), Position.create(0, "/* test */ list".length)),
                unknownToken,
            )],
        ),
        new Test(
            "One incorrect multiline list with comments",
            `/* this is
a comment
to check correct range */

/* test */ list servers = vps,
	vds
edlist`,
            [createDiagnostic(
                Range.create(Position.create(4, "/* test */ ".length), Position.create(4, "/* test */ list".length)),
                unknownToken,
            )],
        ),
        new Test(
            "Three lists, one incorrect",
            `list servers1 = vps,
	vds
endlist
list servers2 = vps,
	vds
edlist
list servers3 = vps,
	vds
endlist`,
            [createDiagnostic(
                Range.create(Position.create(3, 0), Position.create(3, "list".length)),
                unknownToken,
            )],
        ),
        new Test(
            "Correct multiline list, comma on next line",
            `list servers = vps
	,vds
endlist`,
            [],
        ),
        new Test(
            "Incorrect multiline list, comma on next line",
            `list servers = vps
	,vds
edlist`,
            [createDiagnostic(
                Range.create(Position.create(0, 0), Position.create(0, "list".length)),
                unknownToken,
            )],
        ),
    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
