import { Setting } from "./setting";
/**
 * Holds the description of a setting and corresponding methods.
 */
export class DefaultSetting {
    constructor(setting) {
        /**
         * A brief description for the setting
         */
        this.description = "";
        /**
         * User-friendly setting name like 'refresh-interval'
         */
        this.displayName = "";
        /**
         * Array containing all possible values. RegExp is supported
         */
        this.enum = [];
        /**
         * Example value for the setting. Should not equal to the default value
         */
        this.example = "";
        /**
         * The settings in this array must not be declared simultaneously with the current
         */
        this.excludes = [];
        /**
         * The maximum allowed value for the setting
         */
        this.maxValue = Infinity;
        /**
         * The minimum allowed value for the setting
         */
        this.minValue = -Infinity;
        /**
         * Is the setting allowed to be repeated
         */
        this.multiLine = false;
        /**
         * Inner setting name. Lower-cased, without any symbols except alphabetical.
         * For example, "refreshinterval"
         */
        this.name = "";
        /**
         * The type of the setting.
         * Possible values: string, number, integer, boolean, enum, interval, date
         */
        this.type = "";
        /**
         * Type of the widget were setting is applicable, for example,
         * gradient-count is applicable for gauge, treemap and calendar.
         */
        this.widget = [];
        this.overrideCache = [];
        Object.assign(this, setting);
        this.enum = this.enum.map((v) => v.toLowerCase());
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
    applyScope(scope) {
        if (this.override == null) {
            return this;
        }
        let matchingOverrides = this.overrideCache
            .filter((override) => override.test(scope))
            .map((override) => override.setting);
        if (matchingOverrides.length > 0) {
            let copy = Object.create(Setting.prototype);
            return Object.assign(copy, this, ...matchingOverrides);
        }
        else {
            return this;
        }
    }
    /**
     * Generates a string containing fully available information about the setting
     */
    toString() {
        // TODO: describe a script which is allowed as the setting value
        if (this.description == null) {
            return "";
        }
        let result = `${this.description}  \n\n`;
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
        let widgets = "all";
        if (typeof this.widget !== "string" && this.widget.length > 0) {
            widgets = this.widget.join(", ");
        }
        else if (this.widget.length > 0) {
            widgets = this.widget;
        }
        result += `Allowed in widgets: ${widgets}  \n`;
        return result;
    }
    getOverrideTest(scopeSrc) {
        let scopeKeys = ["widget", "section"];
        let scopeSrcExtracted = /^\[(.*)\]$/.exec(scopeSrc);
        if (scopeSrcExtracted == null) {
            throw new Error("Wrong override scope format");
        }
        let source = `return !!(${scopeSrcExtracted[1]});`;
        let compiledScope = new Function(scopeKeys.join(), source);
        return (scope) => {
            try {
                let values = scopeKeys.map((key) => scope[key]);
                return compiledScope.apply(void 0, values);
            }
            catch (error) {
                console.error(`In '${scopeSrc}' :: ${error}`);
            }
        };
    }
}
/**
 * Lowercases the string and deletes non-alphabetic characters
 * @param str string to be cleared
 * @returns cleared string
 */
DefaultSetting.clearSetting = (str) => str.toLowerCase().replace(/[^a-z]/g, "");
/**
 * Lowercases the value of setting
 * @param str string to be cleared
 * @returns cleared string
 */
DefaultSetting.clearValue = (str) => str.toLowerCase();
