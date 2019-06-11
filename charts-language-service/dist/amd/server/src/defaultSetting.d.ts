import { PossibleValue } from "./possibleValue";
import { Script } from "./script";
export interface SettingScope {
    widget: string;
    section: string;
}
interface ValueRange {
    value: number;
    excluded: boolean;
}
/**
 * Holds the description of a setting and corresponding methods.
 */
export declare class DefaultSetting {
    /**
     * Lowercases the string and deletes non-alphabetic characters
     * @param str string to be cleared
     * @returns cleared string
     */
    static clearSetting: (str: string) => string;
    /**
     * Lowercases the value of setting
     * @param str string to be cleared
     * @returns cleared string
     */
    static clearValue: (str: string) => string;
    readonly defaultValue?: string | number | boolean;
    /**
     * A brief description for the setting
     */
    readonly description: string;
    /**
     * User-friendly setting name like 'refresh-interval'
     */
    readonly displayName: string;
    /**
     * Array containing all possible values. RegExp is supported
     */
    readonly enum: string[];
    /**
     * Example value for the setting. Should not equal to the default value
     */
    readonly example: string | number | boolean;
    /**
     * The settings in this array must not be declared simultaneously with the current
     */
    readonly excludes: string[];
    /**
     * The maximum allowed value for the setting
     */
    maxValue: number | ValueRange;
    /**
     * The minimum allowed value for the setting
     */
    minValue: number | ValueRange;
    /**
     * Is the setting allowed to be repeated
     */
    readonly multiLine: boolean;
    /**
     * Inner setting name. Lower-cased, without any symbols except alphabetical.
     * For example, "refreshinterval"
     */
    readonly name: string;
    /**
     * Warning text to show if setting is deprecated
     */
    readonly deprecated?: string;
    /**
     * Holds the description of the setting if it is a script
     */
    readonly script?: Script;
    /**
     * The section, where the setting is applicable.
     * For example, "widget" or "series".
     */
    readonly section?: string | string[];
    /**
     * The type of the setting.
     * Possible values: string, number, integer, boolean, enum, interval, date
     */
    readonly type: string;
    /**
     * Type of the widget were setting is applicable, for example,
     * gradient-count is applicable for gauge, treemap and calendar.
     */
    readonly widget: string[] | string;
    /**
     * String values that can assigned to the setting.
     * Do not prevent use other values, in comparison with enum.
     */
    readonly possibleValues?: PossibleValue[];
    readonly override?: {
        [scope: string]: Partial<DefaultSetting>;
    };
    private overrideCache;
    constructor(setting?: DefaultSetting);
    /**
     * Create an instance of setting with matching overrides applied.
     * If no override can be applied returns this instanse.
     * @param scope Configuration scope where setting exist
     */
    applyScope(scope: SettingScope): DefaultSetting;
    /**
     * Generates a string containing fully available information about the setting
     */
    toString(): string;
    private getOverrideTest;
}
export {};
