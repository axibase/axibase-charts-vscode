import { unknownToken } from "../messageUtil";
import { createDiagnostic } from "../util";
import { Test } from "./test";

const firstVar: string = "serv";
const secondVar: string = "server";
const thirdVar: string = "srv";

suite("Undefined variable in for loop", () => {
    const tests: Test[] = [
        new Test(
            "One correct loop",
            `list servers = 'srv1', 'srv2'
for ${firstVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor`,
            [],
        ),
        new Test(
            "One correct loop with comment",
            `list servers = 'srv1', 'srv2'
for ${firstVar} /* this is a comment */ in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor`,
            [],
        ),
        new Test(
            "Two correct  loops",
            `list servers = 'srv1', 'srv2'
for ${firstVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor
for ${firstVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor`,
            [],
        ),
        new Test(
            "One incorrect loop",
            `list servers = 'srv1', 'srv2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor`,
            [createDiagnostic(
                {
                    end: { character: "       entity = @{".length + firstVar.length, line: 4 },
                    start: { character: "       entity = @{".length, line: 4 },
                },
                unknownToken(firstVar),
            )],
        ),
        new Test(
            "Two incorrect loops",
            `list servers = 'srv1', 'srv2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor
for ${firstVar} in servers
   [series]
       metric = placeholder
       entity = @{${secondVar}}
endfor`,
            [
                createDiagnostic(
                    {
                        end: { character: "       entity = @{".length + firstVar.length, line: 4 },
                        start: { character: "       entity = @{".length, line: 4 },
                    },
                    unknownToken(firstVar),
                ),
                createDiagnostic(
                    {
                        end: { character: "       entity = @{".length + secondVar.length, line: 9 },
                        start: { character: "       entity = @{".length, line: 9 },
                    },
                    unknownToken(secondVar),
                )],
        ),
        new Test(
            "One incorrect loop, one correct loop",
            `list servers = 'srv1', 'srv2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor
for ${firstVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}}
endfor`,
            [createDiagnostic(
                {
                    end: { character: "       entity = @{".length + firstVar.length, line: 4 },
                    start: { character: "       entity = @{".length, line: 4 },
                },
                unknownToken(firstVar),
            )],
        ),
        new Test(
            "One correct nested loop",
            `list servers = 'srv1', 'srv2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{${secondVar}}
   for ${firstVar} in servers
       [series]
           metric = placeholder
           entity = @{${secondVar}}
       [series]
           metric = placeholder
           entity = @{${firstVar}}
   endfor
endfor`,
            [],
        ),
        new Test(
            "One incorrect nested loop",
            `list servers = 'srv1', 'srv2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{${secondVar}}
   for ${firstVar} in servers
       [series]
           metric = placeholder
           entity = @{${thirdVar}}
       [series]
           metric = placeholder
           entity = @{${firstVar}}
   endfor
endfor`,
            [createDiagnostic(
                {
                    end: { character: "           entity = @{".length + thirdVar.length, line: 8 },
                    start: { character: "           entity = @{".length, line: 8 },
                },
                unknownToken(thirdVar),
            )],
        ),
        new Test(
            "Arithmetic expression with correct var",
            `list servers = 'srv1', 'srv2'
for ${firstVar} in servers
   [series]
       metric = placeholder
       entity = @{${firstVar}  ${firstVar}}
endfor`,
            [],
        ),
        new Test(
            "Arithmetic expression with incorrect var",
            `list servers = 'srv1', 'srv2'
for ${firstVar} in servers
   [series]
       metric = placeholder
       entity = @{${secondVar}  ${firstVar}}
endfor`,
            [createDiagnostic(
                {
                    end: { character: "       entity = @{".length + secondVar.length, line: 4 },
                    start: { character: "       entity = @{".length, line: 4 },
                },
                unknownToken(secondVar),
            )],
        ),
        new Test(
            "Function  correct var",
            `list servers = 's1v1', 's1v2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{keepAfterLast(${secondVar}, '1')}
endfor`,
            [],
        ),
        new Test(
            "Property of a correct var",
            `var servers = [ { name: 'srv1' }, { name: 'srv2' } ]
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{${secondVar}.name}
endfor`,
            [],
        ),
        new Test(
            "String",
            `list servers = 'srv1', 'srv2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{keepAfterLast(${secondVar}, 'v')}
endfor`,
            [],
        ),
        new Test(
            "Several statements, second incorrect",
            `list servers = 'srv1', 'srv2'
for ${secondVar} in servers
   [series]
       metric = placeholder
       entity = @{keepAfterLast(${secondVar}, 'v')}, @{${firstVar}}
endfor`,
            [createDiagnostic(
                {
                    end: {
                        character: `       entity = @{keepAfterLast(${secondVar}, 'v')}, @{`.length + firstVar.length,
                        line: 4,
                    },
                    start: { character: `       entity = @{keepAfterLast(${secondVar}, 'v')}, @{`.length, line: 4 },
                },
                unknownToken(firstVar),
            )],
        ),
        new Test(
            "Space between list name and equals sign is absent",
            `list servers= server1, server2
for server in servers
endfor`,
            [],
        ),
    ];

    tests.forEach((test: Test) => { test.validationTest(); });

});
