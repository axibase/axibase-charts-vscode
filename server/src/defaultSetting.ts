import { PossibleValue } from "./possibleValue";
import { Script } from "./script";
import { Setting } from "./setting";

export interface SettingScope {
    widget: string;
    section: string;
}

interface OverrideCacheEntry {
    setting: Partial<DefaultSetting>;
    test(scope: SettingScope): boolean;
}

interface ValueRange {
    value: number;
    excluded: boolean;
}

/**
 * Holds the description of a setting and corresponding methods.
 */
export class DefaultSetting {
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
    public maxValue: number | ValueRange = Infinity;
    /**
     * The minimum allowed value for the setting
     */
    public minValue: number | ValueRange = -Infinity;
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
     * Warning text to show if setting is deprecated
     */
    public readonly deprecated?: string;
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
     * Type of the widget were setting is applicable, for example,
     * gradient-count is applicable for gauge, treemap and calendar.
     */
    public readonly widget: string[] | string = [];
    /**
     * String values that can assigned to the setting.
     * Do not prevent use other values, in comparison with enum.
     */
    public readonly possibleValues?: PossibleValue[];

    public readonly override?: { [scope: string]: Partial<DefaultSetting> };

    private overrideCache: OverrideCacheEntry[] = [];

    public constructor(setting?: DefaultSetting) {
        Object.assign(this, setting);
        this.enum = this.enum.map((v: string): string => v.toLowerCase());
        this.name = DefaultSetting.clearSetting(this.displayName);

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
    public applyScope(scope: SettingScope): DefaultSetting {
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
        let widgets: string[] | string = "all";
        if (typeof this.widget !== "string" && this.widget.length > 0) {
            widgets = this.widget.join(", ");
        } else if (this.widget.length > 0) {
            widgets = this.widget;
        }
        result += `Allowed in widgets: ${widgets}  \n`;

        return result;
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
