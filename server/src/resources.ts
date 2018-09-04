import { readFileSync } from "fs";
import { join } from "path";
import { Setting } from "./setting";
interface IDictionary { $schema: string; settings: Setting[]; }

/**
 * Reads dictionary from "dictionary.json" file
 * @returns array of settings from the file
 */
const readSettings: () => Setting[] = (): Setting[] => {
    const dictionaryFilePath: string = join(__dirname, "dictionary.json");
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
export const requiredSectionSettingsMap: Map<string, Array<Array<Setting | undefined>>> = new Map([
    ["series", [
        [
            settingsMap.get("entity"), settingsMap.get("value"),
            settingsMap.get("entities"), settingsMap.get("entitygroup"),
        ],
        [
            settingsMap.get("metric"), settingsMap.get("value"),
            settingsMap.get("table"), settingsMap.get("attribute"),
        ],
    ]],
    ["widget", [[settingsMap.get("type")],
    ]],
    ["dropdown", [[settingsMap.get("onchange"), settingsMap.get("changefield")],
    ]],
]);

const calendarKeywords: string[] = [
    "current_day", "current_hour", "current_minute", "current_month", "current_quarter", "current_week", "current_year",
    "first_day", "first_vacation_day", "first_working_day", "friday", "last_vacation_day", "last_working_day", "monday",
    "next_day", "next_hour", "next_minute", "next_month", "next_quarter", "next_vacation_day", "next_week",
    "next_working_day", "next_year", "now", "previous_day", "previous_hour", "previous_minute", "previous_month",
    "previous_quarter", "previous_vacation_day", "previous_week", "previous_working_day", "previous_year", "saturday",
    "sunday", "thursday", "tuesday", "wednesday",
];

const intervalUnits: string[] = ["millisecond", "second", "minute", "hour", "day", "week", "month", "quarter", "year"];
const booleanKeywords: string[] = ["false", "no", "null", "none", "0", "off", "true", "yes", "on", "1"];

export const intervalRegExp: RegExp = new RegExp(
    // -5 month, +3 day, .3 year, 2.3 week, all
    `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${intervalUnits.join("|")}))|all)$`,
);

export const booleanRegExp: RegExp = new RegExp(`^(?:${booleanKeywords.join("|")})$`);

// 1, 5.2, 0.3, .9, -8, -0.5, +1.4
export const numberRegExp: RegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;

export const integerRegExp: RegExp = /^[-+]?\d+$/;

export const calendarRegExp: RegExp = new RegExp(
    // current_day
    `^(?:${calendarKeywords.join("|")})` +
    // + 5 * minute
    `(?:[ \\t]*[-+][ \\t]*(?:\\d+|(?:\\d+)?\\.\\d+)[ \\t]*\\*[ \\t]*(?:${intervalUnits.join("|")}))?$`,
);

export const localDateRegExp: RegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12][0-9]|3[01])" +
    // 01:13:46.123, 11:26:52
    "(?: (?:[01]\\d|2[0-4]):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?(?:\\.\\d{1,9})?)?)?)?$",
);

export const zonedDateRegExp: RegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])" +
    // T12:34:46.123, T23:56:18
    "[tT](?:[01]\\d|2[0-4]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:\\.\\d{1,9})?" +
    // Z, +0400, -05:00
    "(?:[zZ]|[+-](?:[01]\\d|2[0-4]):?(?:[0-5][0-9]))$",
);

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
