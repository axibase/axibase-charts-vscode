import { Range } from "vscode-languageserver-types";
import { DefaultSetting } from "./defaultSetting";
import { Setting } from "./setting";
interface SectionRequirements {
    settings?: DefaultSetting[][];
    sections?: string[][];
}
export declare abstract class ResourcesProviderBase {
    static widgetRequirementsByType: Map<string, SectionRequirements>;
    /**
     * Key is section name, value is array of parent sections for the key section
     */
    static parentSections: Map<string, string[]>;
    static sectionDepthMap: {
        [section: string]: number;
    };
    /**
     * Contains names of sections which can appear at depth `1..max_depth`, where
     * `max_depth` is a value from `sectionDepthMap`
     */
    static inheritableSections: Set<string>;
    /**
     * Map of required settings for each section and their "aliases".
     * For instance, `series` requires `entity`, but `entities` is also allowed.
     * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
     */
    static getRequiredSectionSettingsMap(settingsMap: Map<string, DefaultSetting>): Map<string, SectionRequirements>;
    /**
     * @returns array of parent sections for the section
     */
    static getParents(section: string): string[];
    /**
     * @returns true if the current section is nested in the previous section
     */
    static isNestedToPrevious(currentName: string, previousName: string): boolean;
    /**
     * Tests if the provided setting complete or not
     * @param setting the setting to test
     * @returns true, if setting is complete, false otherwise
     */
    protected static isCompleteSetting(setting?: Partial<Setting>): boolean;
    settingsMap: Map<string, DefaultSetting>;
    constructor();
    /**
     * Clears the passed argument and looks for a setting with the same name
     * @param name name of the wanted setting
     * @param range TextRange of the setting in text.
     * @returns the wanted setting or undefined if not found
     */
    getSetting(name: string, range?: Range): Setting | undefined;
    /**
     * Reads descriptions from "descriptions.md" file
     * @returns map of settings names and descriptions
     */
    protected abstract readDescriptions(): Map<string, string>;
    /**
     * Reads dictionary from "dictionary.json" file
     * @returns array of settings from the file
     */
    protected abstract readSettings(): Setting[];
    /**
     * @returns map of settings, key is the setting name, value is instance of Setting
     */
    protected createSettingsMap(): Map<string, DefaultSetting>;
}
export {};
