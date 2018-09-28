import { Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Test } from "./test";

const elseIfError: string = "elseif has no matching if";
const elseError: string = "else has no matching if";
const endIfError: string = "endif has no matching if";
const ifError: string = "if has no matching endif";

suite("If elseif else endif validation tests", () => {
    const tests: Test[] = [
        new Test(
            "One correct if-elseif-endif",
            `list servers = 'srv1', 'srv2'
for server in servers
  [series]
    metric = temp
    entity = @{server}
    if server == 'srv1'
      color = red
    elseif server == 'srv2'
      color = yellow
    endif
endfor`,
            [],
        ),
        new Test(
            "One correct if-else-endif",
            `list servers = 'srv1', 'srv2'
for server in servers
  [series]
    metric = temp
    entity = @{server}
    if server == 'srv1'
      color = red
    else
      color = yellow
    endif
endfor`,
            [],
        ),
        new Test(
            "One incorrect elseif-endif",
            `list servers = 'srv1', 'srv2'
for server in servers
  [series]
    metric = temp
    entity = @{server}
    elseif server == 'srv1'
      color = yellow
    endif
endfor`,
            [
                createDiagnostic(
                    Range.create(5, "    ".length, 5, "    ".length + "elseif".length),
                    elseIfError,
                ),
                createDiagnostic(
                    Range.create(Position.create(7, "    ".length), Position.create(7, "    ".length + "endif".length)),
                    endIfError,
                )],
        ),
        new Test(
            "One incorrect else-endif",
            `list servers = 'srv1', 'srv2'
for server in servers
  [series]
    metric = temp
    entity = @{server}
    else
      color = yellow
    endif
endfor`,
            [
                createDiagnostic(
                    Range.create(Position.create(5, "    ".length), Position.create(5, "    ".length + "else".length)),
                    elseError,
                ),
                createDiagnostic(
                    Range.create(Position.create(7, "    ".length), Position.create(7, "    ".length + "endif".length)),
                    endIfError,
                )],
        ),
        new Test(
            "One incorrect else-endif with comment",
            `list servers = 'srv1', 'srv2'
for server in servers
  [series]
    metric = temp
    entity = @{server}
    /* this is a comment */ else
      color = yellow
    endif /* a comment */ # too
endfor`,
            [
                createDiagnostic(
                    Range.create(
                        5, "    /* this is a comment */ ".length, 5, "    /* this is a comment */ else".length,
                    ),
                    elseError,
                ),
                createDiagnostic(
                    Range.create(Position.create(7, "    ".length), Position.create(7, "    ".length + "endif".length)),
                    endIfError,
                )],
        ),
        new Test(
            "One incorrect if-else",
            `list servers = 'srv1', 'srv2'
for server in servers
  [series]
    metric = temp
    entity = @{server}
    if server == 'srv1'
      color = red
    else
      color = yellow
endfor`,
            [
                createDiagnostic(
                    Range.create(Position.create(9, 0), Position.create(9, "endfor".length)),
                    "for has finished before if",
                ),
                createDiagnostic(
                    Range.create(Position.create(5, "    ".length), Position.create(5, "    ".length + "if".length)),
                    ifError,
                )],
        ),

    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
