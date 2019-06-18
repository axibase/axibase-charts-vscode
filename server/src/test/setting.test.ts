import { deepStrictEqual } from "assert";
import { Util } from "language-service/dist";
import { DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { Validator } from "../validator";

suite("Validator for expand-panels setting", () => {
    const possibleValues = ["all", "auto", "compact", "default", "false", "none", "true"];
    const incorrectValues = ["fals", "no", "notcompact"];

    possibleValues.forEach(settingValue => {
        test(`should not raise diagnostic messages for correct value ${settingValue} in configuration section`, () => {
            const config = `[configuration]
            entity = a
            metric = a
            expand-panels=${settingValue}
            [group]
              [widget]
                type = chart
                [series]`;
            const validator = new Validator(config);
            deepStrictEqual(validator.lineByLine(), [],
                `Validator should not raise error for settings value ${settingValue}.
Configuration: ${config}`);
        });
    });

    possibleValues.forEach(settingValue => {
        test(`should not raise diagnostic messages for correct value ${settingValue} in widget section`, () => {
            const config = `[configuration]
                entity = a
                metric = a
            [group]
            [widget]
        type = chart
        expand-panels = ${settingValue}
        [series]`;
            const validator = new Validator(config);
            deepStrictEqual(validator.lineByLine(), [],
                `Validator should not raise error for settings value ${settingValue}.
Configuration: ${config}`);
        });
    });

    incorrectValues.forEach(settingValue => {
        test(`should raise message about incorrect value ${settingValue} for valid configuration`, () => {
            const config = `[configuration]
                entity = a
                metric = a
            [group]
            [widget]
        type = chart
        expand-panels = ${settingValue}
        [series]`;
            const validator = new Validator(config);
            const actualDiagnostics = validator.lineByLine();
            const expectedDiagnostic = Util.createDiagnostic(
                Range.create(Position.create(6, 8), Position.create(6, 21)),
                `expand-panels must be one of:\n * ${possibleValues.join("\n * ")}`,
                DiagnosticSeverity.Error
            );
            deepStrictEqual(actualDiagnostics, [expectedDiagnostic],
                `Validator should not raise error for settings value ${settingValue}.
Configuration: ${config}`);
        });
    });

    test("should not allow the setting for not chart widget", () => {
        const config = `[configuration]
                entity = a
                metric = a
            [group]
            [widget]
        type = bar
        expand-panels = compact
        [series]`;
        const validator = new Validator(config);
        const actualDiagnostics = validator.lineByLine();
        const expectedDiagnostic = Util.createDiagnostic(
            Range.create(Position.create(6, 8), Position.create(6, 21)),
            "expand-panels setting is not allowed here.",
            DiagnosticSeverity.Error
        );
        deepStrictEqual(actualDiagnostics, [expectedDiagnostic],
            `Validator should inform if setting is not allowed for this type of widget.
Configuration: ${config}`);
    });
});
