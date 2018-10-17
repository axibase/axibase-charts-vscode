import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { PossibleValue } from "./possibleValue";
import { Script } from "./script";
import { createDiagnostic } from "./util";

export interface SettingScope {
    widget: string;
    section: string;
}

interface OverrideCacheEntry {
    setting: Partial<Setting>;
    test(scope: SettingScope): boolean;
}

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
 * Holds the description of a setting and corresponding methods
 */
export class Setting {
    get textRange(): Range {
        return this._textRange;
    }

    set textRange(value: Range) {
        this._textRange = value;
    }
    /**
     * Lowercases the string and deletes non-alphabetic characters
     * @param str string to be cleared
     * @returns cleared string
     */
    public static clearSetting: (str: string) => string = (str: string): string =>
        str.toLowerCase().replace(/[^a-z]/g, "")

    /**
     * Lowercases the value of setting
     * @param str string to be cleared
     * @returns cleared string
     */
    public static clearValue: (str: string) => string = (str: string): string => str.toLowerCase();

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
    public maxValue: number = Infinity;
    /**
     * The minimum allowed value for the setting
     */
    public minValue: number = -Infinity;
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
    public readonly section?: string | string[];
    /**
     * The type of the setting.
     * Possible values: string, number, integer, boolean, enum, interval, date
     */
    public readonly type: string = "";

    /**
     * Setting value.
     */
    public value: string = "";

    public readonly widget?: string;
    /**
     * String values that can assigned to the setting.
     * Do not prevent use other values, in comparison with enum.
     */
    public readonly possibleValues?: PossibleValue[];

    public readonly override?: { [scope: string]: Partial<Setting> };

    private overrideCache: OverrideCacheEntry[] = [];
    private _textRange: Range;

    private additionalChecks = new Map<string, () => Diagnostic | undefined>([
        ["color-range", () => {
            const colors = this.value.split(/,|[^,]\s+/g);
            if (colors.length < 2) {
                return createDiagnostic(this.textRange, `Specify at least two colors.`);
            }
            return undefined;
        }]
    ]);

    public constructor(setting?: Setting) {
        Object.assign(this, setting);
        this.enum = this.enum.map((v: string): string => v.toLowerCase());
        this.name = Setting.clearSetting(this.displayName);

        if (this.override) {
            for (const scope in this.override) {
                if (this.override.hasOwnProperty(scope)) {
                    this.overrideCache.push({
                        setting: this.override[scope],
                        test: this.getOverrideTest(scope),
                    });
                }
            }
        }
    }

    /**
     * Create an instance of setting with matching overrides applied.
     * If no override can be applied returns this instanse.
     * @param scope Configuration scope where setting exist
     */
    public applyScope(scope: SettingScope): Setting {
        if (this.override == null) {
            return this;
        }
        let matchingOverrides = this.overrideCache
            .filter((override) => override.test(scope))
            .map((override) => override.setting);

        if (matchingOverrides.length > 0) {
            let copy = Object.create(Setting.prototype);
            return Object.assign(copy, this, ...matchingOverrides);
        } else {
            return this;
        }
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
                if (this.additionalChecks.has(this.displayName)) {
                    result = this.additionalChecks.get(this.displayName)();
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

    /**
     * Generates a string containing fully available information about the setting
     */
    public toString(): string {
        // TODO: describe a script which is allowed as the setting value
        if (this.description == null) {
            return "";
        }
        let result: string = `${this.description}  \n\n`;
        if (this.example != null && this.example !== "") {
            result += `Example: ${this.displayName} = ${this.example}  \n`;
        }
        if (this.type != null && this.type !== "") {
            result += `Type: ${this.type}  \n`;
        }
        if (this.defaultValue != null && this.defaultValue !== "") {
            result += `Default value: ${this.defaultValue}  \n`;
        }
        if (this.enum == null && this.enum.length === 0) {
            result += `Possible values: ${this.enum.join()}  \n`;
        }
        if (this.excludes != null && this.excludes.length !== 0) {
            result += `Can not be specified with: ${this.excludes.join()}  \n`;
        }
        if (this.maxValue != null && this.maxValue !== Infinity) {
            result += `Maximum: ${this.maxValue}  \n`;
        }
        if (this.minValue != null && this.minValue !== -Infinity) {
            result += `Minimum: ${this.minValue}  \n`;
        }
        if (this.section != null && this.section.length !== 0) {
            result += `Allowed in section: ${this.section}  \n`;
        }
        if (this.widget != null && this.widget !== "") {
            result += `Allowed in widget: ${this.widget}  \n`;
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

    private getOverrideTest(scopeSrc: string): (scope: SettingScope) => boolean {
        let scopeKeys: Array<keyof SettingScope> = ["widget", "section"];
        let scopeSrcExtracted = /^\[(.*)\]$/.exec(scopeSrc);
        if (scopeSrcExtracted == null) {
            throw new Error("Wrong override scope format");
        }
        let source = `return !!(${scopeSrcExtracted[1]});`;
        let compiledScope = new Function(scopeKeys.join(), source);

        return (scope: SettingScope) => {
            try {
                let values = scopeKeys.map((key) => scope[key]);

                return compiledScope.apply(void 0, values);
            } catch (error) {
                console.error(`In '${scopeSrc}' :: ${error}`);
            }
        };
    }
}
