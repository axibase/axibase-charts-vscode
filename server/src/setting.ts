import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { DefaultSetting } from "./defaultSetting";
import { createDiagnostic } from "./util";

export const intervalUnits: string[] = [
    "nanosecond", "millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year",
];

export const calendarKeywords: string[] = [
    "current_day", "current_hour", "current_minute", "current_month", "current_quarter", "current_week",
    "current_year", "first_day", "first_vacation_day", "first_working_day", "friday", "last_vacation_day",
    "last_working_day", "monday", "next_day", "next_hour", "next_minute", "next_month", "next_quarter",
    "next_vacation_day", "next_week", "next_working_day", "next_year", "now", "previous_day", "previous_hour",
    "previous_minute", "previous_month", "previous_quarter", "previous_vacation_day", "previous_week",
    "previous_working_day", "previous_year", "saturday", "sunday", "thursday", "tuesday", "wednesday",
];
const booleanKeywords: string[] = [
    "false", "no", "null", "none", "0", "off", "true", "yes", "on", "1",
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
    // -5 month, +3 day, .3 year, 2.3 week, all
    `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${intervalUnits.join("|")}))|all)$`,
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
 * In addition to DefaultSetting contains specific fields.
 */
export class Setting extends DefaultSetting {

    get textRange(): Range {
        return this._textRange;
    }

    set textRange(value: Range) {
        this._textRange = value;
    }
    /**
     * Setting value.
     */
    public value: string = "";
    /**
     * Setting values for multiline settings (mostly for colors and thresholds).
     */
    public values: string[] = [];
    /**
     * Line number and characters placement of the setting.
     */
    private _textRange: Range;

    public constructor(setting: DefaultSetting) {
        super(setting);
    }

    /**
     * Checks the type of the setting and creates a corresponding diagnostic
     * @param range where the error should be displayed
     */
    public checkType(range: Range): Diagnostic | undefined {
        // TODO: create a diagnostic using information about the current widget
        let result: Diagnostic | undefined;
        // allows ${} and @{} expressions
        if (calculatedRegExp.test(this.value)) {
            return result;
        }
        switch (this.type) {
            case "string": {
                if (!/\S/.test(this.value)) {
                    result = createDiagnostic(range, `${this.displayName} can not be empty`);
                }
                break;
            }
            case "number": {
                const persent = /(\d*)%/.exec(this.value);
                if (this.name === "arrowlength" && persent) {
                    this.maxValue = this.maxValue * 100;
                    this.minValue = this.minValue * 100;
                    this.value = persent[1];
                }
                result = this.checkNumber(numberRegExp,
                    `${this.displayName} should be a real (floating-point) number.`, range);

                break;
            }
            case "integer": {
                result = this.checkNumber(integerRegExp, `${this.displayName} should be an integer number.`, range);
                break;
            }
            case "boolean": {
                if (!booleanRegExp.test(this.value)) {
                    result = createDiagnostic(
                        range, `${this.displayName} should be a boolean value. For example, ${this.example}`,
                    );
                }
                break;
            }
            case "enum": {
                const index: number = this.findIndexInEnum(this.value);
                // Empty enum means that the setting is not allowed
                if (this.enum.length === 0) {
                    result = createDiagnostic(range, `${this.displayName} setting is not allowed here.`);
                } else if (index < 0) {
                    const enumList: string = this.enum.sort().join("\n * ")
                        .replace(/percentile\(.+/, "percentile_{num}");
                    result = createDiagnostic(range, `${this.displayName} must be one of:\n * ${enumList}`);
                }
                break;
            }
            case "interval": {
                if (!intervalRegExp.test(this.value)) {
                    const message =
                        `.\nFor example, ${this.example}. Supported units:\n * ${intervalUnits.join("\n * ")}`;
                    if (this.name === "updateinterval" && /^\d+$/.test(this.value)) {
                        result = createDiagnostic(
                            range,
                            `Specifying the interval in seconds is deprecated.\nUse \`count unit\` format${message}`,
                            DiagnosticSeverity.Warning,
                        );
                    } else {
                        /**
                         * Check other allowed non-interval values
                         * (for example, period, summarize-period, group-period supports "auto")
                         */
                        if (this.enum.length > 0) {
                            if (this.findIndexInEnum(this.value) < 0) {
                                result = createDiagnostic(range,
                                    `Use ${this.enum.sort().join(", ")} or \`count unit\` format${message}`);
                            }
                        } else {
                            result = createDiagnostic(range,
                                `${this.displayName} should be set as \`count unit\`${message}`);
                        }
                    }
                }
                break;
            }
            case "date": {
                if (!isDate(this.value)) {
                    result = createDiagnostic(range,
                        `${this.displayName} should be a date. For example, ${this.example}`);
                }
                break;
            }
            default: {
                throw new Error(`${this.type} is not handled`);
            }
        }

        return result;
    }

    private checkNumber(reg: RegExp, message: string, range: Range): Diagnostic {
        const example = ` For example, ${this.example}`;
        if (!reg.test(this.value)) {
            return createDiagnostic(range, `${message}${example}`);
        }
        if (+this.value < this.minValue || +this.value > this.maxValue) {
            return createDiagnostic(
                range, `${this.displayName} should be in range [${this.minValue}, ${this.maxValue}].${example}`,
            );
        }
        return undefined;
    }

    private findIndexInEnum(value: string) {
        const index: number = this.enum.findIndex((option: string): boolean =>
            new RegExp(`^${option}$`, "i").test(value),
        );
        return index;
    }
}
