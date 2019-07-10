import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { Validator } from "../validator";

suite("CSV columns names spelling tests", () => {
    test("Incorrectly spelled csv column name in for", () => {
        const config = `
csv servers =
    name, cpu_load
    s1, 23
    s2, 13
endcsv
for srv in servers
    label = @{srv.name}
    value = @{srv.cpuload}
endfor`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = createDiagnostic(
            Range.create(Position.create(8, 14), Position.create(8, 21)),
            "Cannot read cpuload of srv",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic], config);
    });
});
