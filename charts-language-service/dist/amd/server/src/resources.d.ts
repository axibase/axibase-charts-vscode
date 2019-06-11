import { DefaultSetting } from "./defaultSetting";
export declare const settingsMap: Map<string, DefaultSetting>;
interface SectionRequirements {
    settings?: DefaultSetting[][];
    sections?: string[][];
}
/**
 * Map of required settings for each section and their "aliases".
 * For instance, `series` requires `entity`, but `entities` is also allowed.
 * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
 */
export declare const requiredSectionSettingsMap: Map<string, SectionRequirements>;
export declare const widgetRequirementsByType: Map<string, SectionRequirements>;
/**
 * Key is section name, value is array of parent sections for the key section
 */
export declare const parentSections: Map<string, string[]>;
/**
 * @returns true if the current section is nested in the previous section
 */
export declare function isNestedToPrevious(currentName: string, previousName: string): boolean;
/**
 * @returns array of parent sections for the section
 */
export declare function getParents(section: string): string[];
export declare const sectionDepthMap: {
    [section: string]: number;
};
/**
 * Contains names of sections which can appear at depth `1..max_depth`, where
 * `max_depth` is a value from `sectionDepthMap`
 */
export declare const inheritableSections: Set<string>;
export {};
