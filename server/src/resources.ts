import { readFileSync } from "fs";
import { join } from "path";
import { Setting } from "./setting";
interface IDictionary { $schema: string; settings: Setting[]; }

/**
 * Reads dictionary from "dictionary.json" file
 * @returns array of settings from the file
 */
const readSettings: () => Setting[] = (): Setting[] => {
    const dictionaryFilePath: string = join(__dirname, "..", "dictionary.json");
    const jsonContent: string = readFileSync(dictionaryFilePath, "UTF-8");
    const dictionary: IDictionary = JSON.parse(jsonContent) as IDictionary;

    return dictionary.settings;
};

/**
 * Tests if the provided setting complete or not
 * @param setting the setting to test
 * @returns true, if setting is complete, false otherwise
 */
const isCompleteSetting: (setting?: Partial<Setting>) => boolean = (setting?: Partial<Setting>): boolean =>
    setting !== undefined &&
    setting.displayName !== undefined &&
    setting.type !== undefined &&
    setting.example !== undefined;

/**
 * @returns map of settings, key is the setting name, value is instance of Setting
 */
const createSettingsMap: () => Map<string, Setting> = (): Map<string, Setting> => {
    const map: Map<string, Setting> = new Map();
    for (const setting of readSettings()) {
        if (isCompleteSetting(setting)) {
            const completeSetting: Setting = new Setting(setting);
            map.set(completeSetting.name, completeSetting);
        }
    }

    return map;
};
export const settingsMap: Map<string, Setting> = createSettingsMap();

/**
 * Map of required settings for each section and their "aliases".
 * For instance, `series` requires `entity`, but `entities` is also allowed.
 * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
 */
export const requiredSectionSettingsMap: Map<string, Setting[][]> = new Map([
    ["series", [
        [
            settingsMap.get("entity")!, settingsMap.get("value")!,
            settingsMap.get("entities")!, settingsMap.get("entitygroup")!,
        ],
        [
            settingsMap.get("metric")!, settingsMap.get("value")!,
            settingsMap.get("table")!, settingsMap.get("attribute")!,
        ],
    ]],
    ["widget", [[settingsMap.get("type")!],
    ]],
    ["dropdown", [[settingsMap.get("onchange")!, settingsMap.get("changefield")!],
    ]],
]);

/**
 * Key is section name, value is array of parent sections for the key section
 */
export const parentSections: Map<string, string[]> = new Map([
    ["widget", ["group", "configuration"]],
    ["series", ["widget", "column"]],
    ["tag", ["series"]],
    ["tags", ["series"]],
    ["column", ["widget"]],
    ["node", ["widget"]],
    ["link", ["widget"]],
]);

/**
 * @returns array of parent sections for the section
 */
export const getParents: (section: string) => string[] = (section: string): string[] => {
    let parents: string[] = [];
    const found: string[] | undefined = parentSections.get(section);
    if (found) {
        for (const father of found) {
            // JS recursion is not tail-optimized, replace if possible
            parents = parents.concat(father, getParents(father));
        }
    }

    return parents;
};

/**
 * Array of all possible sections
 */
export const possibleSections: string[] = [
    "column", "configuration", "dropdown", "group", "keys", "link", "node", "option", "other", "placeholders",
    "properties", "property", "series", "tag", "tags", "threshold", "widget",
];
