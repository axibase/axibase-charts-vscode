import { isNode } from "browser-or-node";
import { DefaultSetting } from "./defaultSetting";
import { Setting } from "./setting";
interface IDictionary { $schema: string; settings: Setting[]; }

/**
 * Reads dictionary from "dictionary.json" file
 * @returns array of settings from the file
 */
function readSettings(): Setting[] {
    let dictionary: IDictionary;

    if (isNode) {
        const path = require("path");
        const fs = require("fs");
        const dictionaryFilePath: string = path.join(__dirname, "..", "dictionary.json");
        const jsonContent: string = fs.readFileSync(dictionaryFilePath, "UTF-8");
        dictionary = JSON.parse(jsonContent) as IDictionary;
    } else {
        const jsonContent: string = require("../dictionary.json");
        dictionary = (jsonContent as any) as IDictionary;
    }

    return dictionary.settings;
}

/**
 * Reads descriptions from "descriptions.md" file
 * @returns map of settings names and descriptions
 */
function readDescriptions(): Map<string, string> {
    let content: string = "";

    if (isNode) {
        const path = require("path");
        const fs = require("fs");
        const descriptionsPath: string = path.join(__dirname, "..", "descriptions.md");
        content = fs.readFileSync(descriptionsPath, "UTF-8");
    } else {
        content = require("../descriptions.md").default;
    }

    const map: Map<string, string> = new Map();
    // ## settingname\n\nsetting description[url](hello#html)\n
    const regExp: RegExp = /\#\# ([a-z]+?)  \n  \n([^\s#][\S\s]+?)  (?=\n  (?:\n(?=\#)|$))/g;
    let match: RegExpExecArray | null = regExp.exec(content);
    while (match !== null) {
        const [, name, description] = match;
        map.set(name, description);
        match = regExp.exec(content);
    }

    return map;
}

/**
 * Tests if the provided setting complete or not
 * @param setting the setting to test
 * @returns true, if setting is complete, false otherwise
 */
function isCompleteSetting(setting?: Partial<Setting>): boolean {
    return setting !== undefined &&
        setting.displayName !== undefined &&
        setting.type !== undefined &&
        setting.example !== undefined;
}

/**
 * @returns map of settings, key is the setting name, value is instance of Setting
 */
function createSettingsMap(): Map<string, DefaultSetting> {
    const descriptions: Map<string, string> = readDescriptions();
    const settings: Setting[] = readSettings();
    const map: Map<string, Setting> = new Map();
    for (const setting of settings) {
        if (isCompleteSetting(setting)) {
            const name: string = Setting.clearSetting(setting.displayName);
            Object.assign(setting, { name, description: descriptions.get(name) });
            const completeSetting: Setting = new Setting(setting);
            map.set(completeSetting.name, completeSetting);
        }
    }

    return map;
}

export const settingsMap: Map<string, DefaultSetting> = createSettingsMap();

interface SectionRequirements {
    settings?: DefaultSetting[][];
    sections?: string[][];
}
/**
 * Map of required settings for each section and their "aliases".
 * For instance, `series` requires `entity`, but `entities` is also allowed.
 * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
 */
export const requiredSectionSettingsMap = new Map<string, SectionRequirements>([
    ["configuration", {
        sections: [
            ["group"],
        ],
    }],
    ["series", {
        settings: [
            [
                settingsMap.get("entity")!, settingsMap.get("value")!,
                settingsMap.get("entities")!, settingsMap.get("entitygroup")!,
                settingsMap.get("entityexpression")!,
            ],
            [
                settingsMap.get("metric")!, settingsMap.get("value")!,
                settingsMap.get("table")!, settingsMap.get("attribute")!,
            ],
        ],
    }],
    ["group", {
        sections: [
            ["widget"],
        ],
    }],
    ["widget", {
        sections: [
            ["series"],
        ],
        settings: [
            [settingsMap.get("type")!],
        ],
    }],
    ["dropdown", {
        settings: [
            [settingsMap.get("onchange")!, settingsMap.get("changefield")!],
        ],
    }],
    ["node", {
        settings: [
            [settingsMap.get("id")],
        ],
    }],
]);

export const widgetRequirementsByType: Map<string, SectionRequirements> = new Map([
    ["console", {
        sections: [],
    }],
    ["page", {
        sections: [],
    }],
    ["property", {
        sections: [
            ["property"],
        ],
    }],
    ["graph", {
        sections: [
            ["series", "node", "link"]
        ],
    }],
]);

/**
 * Key is section name, value is array of parent sections for the key section
 */
export const parentSections: Map<string, string[]> = new Map([
    ["widget", ["group", "configuration"]],
    ["series", ["widget", "link"]],
    ["tag", ["series"]],
    ["tags", ["series"]],
    ["column", ["widget"]],
    ["node", ["widget"]],
    ["link", ["widget"]],
    ["option", ["dropdown"]]
]);

/**
 * @returns true if the current section is nested in the previous section
 */
export function isNestedToPrevious(currentName: string, previousName: string): boolean {
    if (currentName === undefined || previousName === undefined) {
        return false;
    }

    return getParents(currentName).includes(previousName);
}

/**
 * @returns array of parent sections for the section
 */
export function getParents(section: string): string[] {
    let parents: string[] = [];
    const found: string[] | undefined = parentSections.get(section);
    if (found !== undefined) {
        for (const father of found) {
            // JS recursion is not tail-optimized, replace if possible
            parents = parents.concat(father, getParents(father));
        }
    }

    return parents;
}

export const sectionDepthMap: { [section: string]: number } = {
    "configuration": 0,

    "group": 1,

    "widget": 2,

    "column": 3,
    "dropdown": 3,
    "keys": 3,
    "link": 3,
    "node": 3,
    "other": 3,
    "placeholders": 3,
    "property": 3,
    "series": 3,
    "threshold": 3,

    "option": 4,
    "properties": 4,
    "tag": 4,
    "tags": 4,
};

/**
 * Contains names of sections which can appear at depth `1..max_depth`, where
 * `max_depth` is a value from `sectionDepthMap`
 */
export const inheritableSections: Set<string> = new Set([
    "keys", "tags"
]);
