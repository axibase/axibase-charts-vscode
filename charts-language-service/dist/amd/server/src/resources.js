define(["require", "exports", "browser-or-node", "./setting"], function (require, exports, browser_or_node_1, setting_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Reads dictionary from "dictionary.json" file
     * @returns array of settings from the file
     */
    function readSettings() {
        let dictionary;
        if (browser_or_node_1.isNode) {
            const path = require("path");
            const fs = require("fs");
            const dictionaryFilePath = path.join(__dirname, "..", "dictionary.json");
            const jsonContent = fs.readFileSync(dictionaryFilePath, "UTF-8");
            dictionary = JSON.parse(jsonContent);
        }
        else {
            const jsonContent = require("../dictionary.json");
            dictionary = jsonContent;
        }
        return dictionary.settings;
    }
    /**
     * Reads descriptions from "descriptions.md" file
     * @returns map of settings names and descriptions
     */
    function readDescriptions() {
        let content = "";
        if (browser_or_node_1.isNode) {
            const path = require("path");
            const fs = require("fs");
            const descriptionsPath = path.join(__dirname, "..", "descriptions.md");
            content = fs.readFileSync(descriptionsPath, "UTF-8");
        }
        else {
            content = require("../descriptions.md").default;
        }
        const map = new Map();
        // ## settingname\n\nsetting description[url](hello#html)\n
        const regExp = /\#\# ([a-z]+?)  \n  \n([^\s#][\S\s]+?)  (?=\n  (?:\n(?=\#)|$))/g;
        let match = regExp.exec(content);
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
    function isCompleteSetting(setting) {
        return setting !== undefined &&
            setting.displayName !== undefined &&
            setting.type !== undefined &&
            setting.example !== undefined;
    }
    /**
     * @returns map of settings, key is the setting name, value is instance of Setting
     */
    function createSettingsMap() {
        const descriptions = readDescriptions();
        const settings = readSettings();
        const map = new Map();
        for (const setting of settings) {
            if (isCompleteSetting(setting)) {
                const name = setting_1.Setting.clearSetting(setting.displayName);
                Object.assign(setting, { name, description: descriptions.get(name) });
                const completeSetting = new setting_1.Setting(setting);
                map.set(completeSetting.name, completeSetting);
            }
        }
        return map;
    }
    exports.settingsMap = createSettingsMap();
    /**
     * Map of required settings for each section and their "aliases".
     * For instance, `series` requires `entity`, but `entities` is also allowed.
     * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
     */
    exports.requiredSectionSettingsMap = new Map([
        ["configuration", {
                sections: [
                    ["group"],
                ],
            }],
        ["series", {
                settings: [
                    [
                        exports.settingsMap.get("entity"), exports.settingsMap.get("value"),
                        exports.settingsMap.get("entities"), exports.settingsMap.get("entitygroup"),
                        exports.settingsMap.get("entityexpression"),
                    ],
                    [
                        exports.settingsMap.get("metric"), exports.settingsMap.get("value"),
                        exports.settingsMap.get("table"), exports.settingsMap.get("attribute"),
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
                    [exports.settingsMap.get("type")],
                ],
            }],
        ["dropdown", {
                settings: [
                    [exports.settingsMap.get("onchange"), exports.settingsMap.get("changefield")],
                ],
            }],
        ["node", {
                settings: [
                    [exports.settingsMap.get("id")],
                ],
            }],
    ]);
    exports.widgetRequirementsByType = new Map([
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
    exports.parentSections = new Map([
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
    function isNestedToPrevious(currentName, previousName) {
        if (currentName === undefined || previousName === undefined) {
            return false;
        }
        return getParents(currentName).includes(previousName);
    }
    exports.isNestedToPrevious = isNestedToPrevious;
    /**
     * @returns array of parent sections for the section
     */
    function getParents(section) {
        let parents = [];
        const found = exports.parentSections.get(section);
        if (found !== undefined) {
            for (const father of found) {
                // JS recursion is not tail-optimized, replace if possible
                parents = parents.concat(father, getParents(father));
            }
        }
        return parents;
    }
    exports.getParents = getParents;
    exports.sectionDepthMap = {
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
    exports.inheritableSections = new Set([
        "keys", "tags"
    ]);
});
