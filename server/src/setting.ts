import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { Script } from "./script";
import { createDiagnostic } from "./util";

const booleanKeywords: string[] = [
    "false", "no", "null", "none", "0", "off", "true", "yes", "on", "1",
];

const intervalUnits: string[] = [
    "nanosecond", "millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year",
];

const calendarKeywords: string[] = [
    "current_day", "current_hour", "current_minute", "current_month", "current_quarter", "current_week",
    "current_year", "first_day", "first_vacation_day", "first_working_day", "friday", "last_vacation_day",
    "last_working_day", "monday", "next_day", "next_hour", "next_minute", "next_month", "next_quarter",
    "next_vacation_day", "next_week", "next_working_day", "next_year", "now", "previous_day", "previous_hour",
    "previous_minute", "previous_month", "previous_quarter", "previous_vacation_day", "previous_week",
    "previous_working_day", "previous_year", "saturday", "sunday", "thursday", "tuesday", "wednesday",
];

const booleanRegExp: RegExp = new RegExp(`^(?:${booleanKeywords.join("|")})$`);

const calendarRegExp: RegExp = new RegExp(
    // current_day
    `^(?:${calendarKeywords.join("|")})` +
    // + 5 * minute
    `(?:[ \\t]*[-+][ \\t]*(?:\\d+|(?:\\d+)?\\.\\d+)[ \\t]*\\*[ \\t]*(?:${intervalUnits.join("|")}))?$`,
);

const integerRegExp: RegExp = /^[-+]?\d+$/;

const intervalRegExp: RegExp = new RegExp(
    // -5 month, +3 day, .3 year, 2.3 week, all, auto, none
    `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${intervalUnits.join("|")}))|all|auto|none)$`,
);

const localDateRegExp: RegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12][0-9]|3[01])" +
    // 01:13:46.123, 11:26:52
    "(?: (?:[01]\\d|2[0-4]):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?(?:\\.\\d{1,9})?)?)?)?$",
);

// 1, 5.2, 0.3, .9, -8, -0.5, +1.4
const numberRegExp: RegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;

const zonedDateRegExp: RegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])" +
    // T12:34:46.123, T23:56:18
    "[tT](?:[01]\\d|2[0-4]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:\\.\\d{1,9})?" +
    // Z, +0400, -05:00
    "(?:[zZ]|[+-](?:[01]\\d|2[0-4]):?(?:[0-5][0-9]))$",
);

const calculatedRegExp: RegExp = /[@$]\{.+\}/;

/**
 * Tests the provided string with regular expressions
 * @param text the target string
 * @returns true if the string is date expression, false otherwise
 */
function isDate(text: string): boolean {
    return calendarRegExp.test(text) || localDateRegExp.test(text) || zonedDateRegExp.test(text);
}

/**
 * Holds the description of a setting and corresponding methods
 */
export class Setting {
    /**
     * Lowercases the string and deletes non-alphabetic characters
     * @param str string to be cleared
     * @returns cleared string
     */
    public static clearSetting(str: string): string {
        return str.toLowerCase().replace(/[^a-z]/g, "");
    }

    /**
     * The value which is applied when the setting is not declared
     */
    public readonly defaultValue?: string | number | boolean;
    /**
     * A brief description for the setting
     */
    public readonly description: string = "";
    /**
     * User-friendly setting name like 'refresh-interval'
     */
    public readonly displayName: string = "";
    /**
     * Array containing all possible values. RegExp is supported
     */
    public readonly enum: string[] = [];
    /**
     * Example value for the setting. Should not equal to the default value
     */
    public readonly example: string | number | boolean = "";
    /**
     * The settings in this array must not be declared simultaneously with the current
     */
    public readonly excludes: string[] = [];
    /**
     * The maximum allowed value for the setting
     */
    public readonly maxValue: number = Infinity;
    /**
     * The minimum allowed value for the setting
     */
    public readonly minValue: number = -Infinity;
    /**
     * Is the setting allowed to be repeated
     */
    public readonly multiLine: boolean = false;
    /**
     * Inner setting name. Lower-cased, without any symbols except alphabetical.
     * For example, "refreshinterval"
     */
    public readonly name: string = "";
    /**
     * Holds the description of the setting if it is a script
     */
    public readonly script?: Script;
    /**
     * The section, where the setting is applicable.
     * For example, "widget" or "series".
     */
    public readonly section?: string;
    /**
     * The type of the setting.
     * Possible values: string, number, integer, boolean, enum, interval, date
     */
    public readonly type: string = "";
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
        // Someday widget will be used to perform type check based on the current widget type
        // For example, class in alert-console supports terminal, but does not in bar
        let result: Diagnostic | undefined;
        // allows ${} and @{} expressions
        if (calculatedRegExp.test(value)) {
            return result;
        }
        switch (this.type) {
            case "string": {
                if (value.length === 0) {
                    result = createDiagnostic(range, DiagnosticSeverity.Error, `${name} can not be empty`);
                }
                break;
            }
            case "number": {
                if (!numberRegExp.test(value)) {
                    result = createDiagnostic(
                        range, DiagnosticSeverity.Error,
                        `${name} should be a real (floating-point) number. For example, ${this.example}`,
                    );
                }
                break;
            }
            case "integer": {
                if (!integerRegExp.test(value)) {
                    result = createDiagnostic(
                        range, DiagnosticSeverity.Error,
                        `${name} should be an integer number. For example, ${this.example}`,
                    );
                }
                break;
            }
            case "boolean": {
                if (!booleanRegExp.test(value)) {
                    result = createDiagnostic(
                        range, DiagnosticSeverity.Error,
                        `${name} should be a boolean value. For example, ${this.example}`,
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
                    result = createDiagnostic(
                        range, DiagnosticSeverity.Error, `${name} must be one of:\n${enumList}`,
                    );
                }
                break;
            }
            case "interval": {
                if (!intervalRegExp.test(value)) {
                    const message: string =
                        `.\nFor example, ${this.example}. Supported units:\n * ${intervalUnits.join("\n * ")}`;
                    if (this.name === "updateinterval" && /^\d+$/.test(value)) {
                        result = createDiagnostic(
                            range, DiagnosticSeverity.Warning,
                            `Specifying the interval in seconds is deprecated.\nUse \`count unit\` format${message}`,
                        );
                    } else {
                        result = createDiagnostic(
                            range, DiagnosticSeverity.Error,
                            `${name} should be set as \`count unit\`${message}`,
                        );
                    }
                }
                break;
            }
            case "date": {
                if (!isDate(value)) {
                    result = createDiagnostic(
                        range, DiagnosticSeverity.Error,
                        `${name} should be a date. For example, ${this.example}`,
                    );
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
