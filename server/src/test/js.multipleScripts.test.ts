import { deepStrictEqual } from "assert";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { createDiagnostic } from "../util";
import { JavaScriptValidator } from "../javaScriptValidator";

suite("Multiple script errors", () => {
  test("Warns if there are multiple script errors in document", () => {
    const config = `
        [configuration]
        [group]
          [widget]
            type = bar
            metric = a
            [column]
            [series]
              entity = b
              script
                var test = hello;
              endscript
            [series]
              entity = c
              replace-value = Math.log(vahlue)
              script
                var example = server;
              endscript`;
    const validator = new JavaScriptValidator(config);
    const expectedDiagnostics = [
      createDiagnostic(
        Range.create(Position.create(10, 0), Position.create(10, 33)),
        "hello is not defined", DiagnosticSeverity.Warning,
      ),
      createDiagnostic(
        Range.create(Position.create(14, 30), Position.create(14, 46)),
        "vahlue is not defined", DiagnosticSeverity.Warning,
      ),
      createDiagnostic(
        Range.create(Position.create(16, 0), Position.create(16, 37)),
        "server is not defined", DiagnosticSeverity.Warning,
      )
    ];
    const actualDiagnostics = validator.validate(true);
    deepStrictEqual(actualDiagnostics, expectedDiagnostics);
  });
});