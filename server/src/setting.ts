import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { Script } from "./script";
import { createDiagnostic } from "./util";

export class Setting {
    /**
     * Lowercases the string and deletes non-alphabetic characters
     * @param str string to be cleared
     * @returns cleared string
     */
    public static clearSetting: (str: string) => string = (str: string): string => str.toLowerCase()
        .replace(/[^a-z]/g, "")
    private static readonly booleanKeywords: string[] = [
        "false", "no", "null", "none", "0", "off", "true", "yes", "on", "1",
    ];
    private static readonly intervalUnits: string[] = [
        "nanosecond", "millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year",
    ];

    private static readonly booleanRegExp: RegExp = new RegExp(`^(?:${Setting.booleanKeywords.join("|")})$`);

    private static readonly calendarKeywords: string[] = [
        "current_day", "current_hour", "current_minute", "current_month", "current_quarter", "current_week",
        "current_year", "first_day", "first_vacation_day", "first_working_day", "friday", "last_vacation_day",
        "last_working_day", "monday", "next_day", "next_hour", "next_minute", "next_month", "next_quarter",
        "next_vacation_day", "next_week", "next_working_day", "next_year", "now", "previous_day", "previous_hour",
        "previous_minute", "previous_month", "previous_quarter", "previous_vacation_day", "previous_week",
        "previous_working_day", "previous_year", "saturday", "sunday", "thursday", "tuesday", "wednesday",
    ];

    private static readonly calendarRegExp: RegExp = new RegExp(
        // current_day
        `^(?:${Setting.calendarKeywords.join("|")})` +
        // + 5 * minute
        `(?:[ \\t]*[-+][ \\t]*(?:\\d+|(?:\\d+)?\\.\\d+)[ \\t]*\\*[ \\t]*(?:${Setting.intervalUnits.join("|")}))?$`,
    );

    private static readonly integerRegExp: RegExp = /^[-+]?\d+$/;

    private static readonly intervalRegExp: RegExp = new RegExp(
        // -5 month, +3 day, .3 year, 2.3 week, all
        `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${Setting.intervalUnits.join("|")}))|all)$`,
    );

    private static readonly localDateRegExp: RegExp = new RegExp(
        // 2018-12-31
        "^(?:19[7-9]|[2-9]\\d\\d)\\d(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12][0-9]|3[01])" +
        // 01:13:46.123, 11:26:52
        "(?: (?:[01]\\d|2[0-4]):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?(?:\\.\\d{1,9})?)?)?)?$",
    );

    // 1, 5.2, 0.3, .9, -8, -0.5, +1.4
    private static readonly numberRegExp: RegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;

    private static readonly zonedDateRegExp: RegExp = new RegExp(
        // 2018-12-31
        "^(?:19[7-9]|[2-9]\\d\\d)\\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])" +
        // T12:34:46.123, T23:56:18
        "[tT](?:[01]\\d|2[0-4]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:\\.\\d{1,9})?" +
        // Z, +0400, -05:00
        "(?:[zZ]|[+-](?:[01]\\d|2[0-4]):?(?:[0-5][0-9]))$",
    );

    private static readonly calculatedRegExp: RegExp = /[@$]\{.+\}/;

    /**
     * Tests the provided string with regular expressions
     * @param text the target string
     * @returns true if the string is date expression, false otherwise
     */
    private static readonly isDate: (text: string) => boolean = (text: string): boolean =>
        Setting.calendarRegExp.test(text) || Setting.localDateRegExp.test(text) || Setting.zonedDateRegExp.test(text)
    public readonly defaultValue?: string | number | boolean;
    public readonly description: string = "";
    public readonly displayName: string = "";
    public readonly enum: string[] = [];
    public readonly example: string | number | boolean = "";
    public readonly excludes: string[] = [];
    public readonly maxValue: number = Infinity;
    public readonly minValue: number = -Infinity;
    public readonly multiLine: boolean = false;
    public readonly name: string = "";
    public readonly script?: Script;
    public readonly section?: string;
    public readonly type: string = "";
    public readonly widget?: string;
    public constructor(setting?: Setting) {
        Object.assign(this, setting);
        this.enum = this.enum.map((v: string): string => v.toLowerCase());
        this.name = Setting.clearSetting(this.displayName);
    }

    /**
     * Checks the type of the setting and creates a corresponding diagnostic
     * @param value value which is assigned to the setting
     * @param widget widget where the setting is declared (none if no widget is found)
     * @param range where the error should be displayed
     * @param name name of the setting which is used by user
     */
    public checkType(value: string, range: Range, name: string, _widget?: string): Diagnostic | undefined {
        let result: Diagnostic | undefined;
        // allows ${} and @{} expressions
        if (Setting.calculatedRegExp.test(value)) {
            return result;
        }
        switch (this.type) {
            case "string": {
                if (value.length === 0) {
                    result = createDiagnostic(range, `${name} can not be empty`);
                }
                break;
            }
            case "number": {
                if (!Setting.numberRegExp.test(value)) {
                    result = createDiagnostic(
                        range, `${name} should be a real (floating-point) number. For example, ${this.example}`,
                    );
                }
                break;
            }
            case "integer": {
                if (!Setting.integerRegExp.test(value)) {
                    result = createDiagnostic(
                        range, `${name} should be an integer number. For example, ${this.example}`,
                    );
                }
                break;
            }
            case "boolean": {
                if (!Setting.booleanRegExp.test(value)) {
                    result = createDiagnostic(
                        range, `${name} should be a boolean value. For example, ${this.example}`,
                    );
                }
                break;
            }
            case "enum": {
                const index: number = this.enum.findIndex((option: string): boolean =>
                    new RegExp(`^${option}$`, "i").test(value),
                );
                if (index < 0) {
                    const enumList: string = this.enum.join(";\n")
                        .replace(/percentile\(.+/, "percentile_{num};");
                    result = createDiagnostic(range, `${name} must be one of:\n${enumList}`);
                }
                break;
            }
            case "interval": {
                if (!Setting.intervalRegExp.test(value)) {
                    const message: string =
                        `.\nFor example, ${this.example}. Supported units:\n * ${Setting.intervalUnits.join("\n * ")}`;
                    if (this.name === "updateinterval" && /^\d+$/.test(value)) {
                        result = createDiagnostic(
                            range,
                            `Specifying the interval in seconds is deprecated.\nUse \`count unit\` format${message}`,
                            DiagnosticSeverity.Warning,
                        );
                    } else {
                        result = createDiagnostic(range, `${name} should be set as \`count unit\`${message}`);
                    }
                }
                break;
            }
            case "date": {
                if (!Setting.isDate(value)) {
                    result = createDiagnostic(range, `${name} should be a date. For example, ${this.example}`);
                }
                break;
            }
            default: {
                throw new Error(`${this.type} is not handled`);
            }
        }

        return result;
    }
}
