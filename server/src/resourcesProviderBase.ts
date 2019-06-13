import { DefaultSetting } from "./defaultSetting";
import { Setting } from "./setting";

interface IDictionary { $schema: string; settings: Setting[]; }
interface SectionRequirements {
    settings?: DefaultSetting[][];
    sections?: string[][];
}

export class ResourcesProviderBase {

    public static widgetRequirementsByType: Map<string, SectionRequirements> = new Map([
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
    public static parentSections: Map<string, string[]> = new Map([
        ["widget", ["group", "configuration"]],
        ["series", ["widget", "link"]],
        ["tag", ["series"]],
        ["tags", ["series"]],
        ["column", ["widget"]],
        ["node", ["widget"]],
        ["link", ["widget"]],
        ["option", ["dropdown"]]
    ]);

    public static sectionDepthMap: { [section: string]: number } = {
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
    public static inheritableSections: Set<string> = new Set([
        "keys", "tags"
    ]);

    /**
     * Map of required settings for each section and their "aliases".
     * For instance, `series` requires `entity`, but `entities` is also allowed.
     * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
     */
    public static getRequiredSectionSettingsMap(
        settingsMap: Map<string, DefaultSetting>
    ): Map<string, SectionRequirements> {
        return new Map<string, SectionRequirements>([
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
    }

    /**
     * @returns array of parent sections for the section
     */
    public static getParents(section: string): string[] {
        let parents: string[] = [];
        const found: string[] | undefined = ResourcesProviderBase.parentSections.get(section);
        if (found !== undefined) {
            for (const father of found) {
                // JS recursion is not tail-optimized, replace if possible
                parents = parents.concat(father, this.getParents(father));
            }
        }

        return parents;
    }

    /**
     * @returns true if the current section is nested in the previous section
     */
    public static isNestedToPrevious(currentName: string, previousName: string): boolean {
        if (currentName === undefined || previousName === undefined) {
            return false;
        }

        return ResourcesProviderBase.getParents(currentName).includes(previousName);
    }

    /**
     * Reads dictionary from "dictionary.json" file
     * @returns array of settings from the file
     */
    protected static readSettings(): Setting[] {
        const path = require("path");
        const fs = require("fs");
        const dictionaryFilePath: string = path.join(__dirname, "..", "dictionary.json");
        const jsonContent: string = fs.readFileSync(dictionaryFilePath, "UTF-8");
        const dictionary: IDictionary = JSON.parse(jsonContent) as IDictionary;

        return dictionary.settings;
    }

    /**
     * Reads descriptions from "descriptions.md" file
     * @returns map of settings names and descriptions
     */
    protected static readDescriptions(): Map<string, string> {
        const path = require("path");
        const fs = require("fs");
        const descriptionsPath: string = path.join(__dirname, "..", "descriptions.md");
        const content: string = fs.readFileSync(descriptionsPath, "UTF-8");

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
    protected static isCompleteSetting(setting?: Partial<Setting>): boolean {
        return setting !== undefined &&
            setting.displayName !== undefined &&
            setting.type !== undefined &&
            setting.example !== undefined;
    }
    public settingsMap: Map<string, DefaultSetting>;

    constructor() {
        this.settingsMap = this.createSettingsMap();
    }

    /**
     * @returns map of settings, key is the setting name, value is instance of Setting
     */
    protected createSettingsMap(): Map<string, DefaultSetting> {
        const descriptions: Map<string, string> = ResourcesProviderBase.readDescriptions();
        const settings: Setting[] = ResourcesProviderBase.readSettings();
        const map: Map<string, Setting> = new Map();
        for (const setting of settings) {
            if (ResourcesProviderBase.isCompleteSetting(setting)) {
                const name: string = Setting.clearSetting(setting.displayName);
                Object.assign(setting, { name, description: descriptions.get(name) });
                const completeSetting: Setting = new Setting(setting);
                map.set(completeSetting.name, completeSetting);
            }
        }

        return map;
    }
}
