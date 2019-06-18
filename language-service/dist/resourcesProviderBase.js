var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./setting"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var setting_1 = require("./setting");
    var ResourcesProviderBase = /** @class */ (function () {
        function ResourcesProviderBase() {
            this.settingsMap = this.createSettingsMap();
        }
        /**
         * Map of required settings for each section and their "aliases".
         * For instance, `series` requires `entity`, but `entities` is also allowed.
         * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
         */
        ResourcesProviderBase.getRequiredSectionSettingsMap = function (settingsMap) {
            return new Map([
                ["configuration", {
                        sections: [
                            ["group"],
                        ],
                    }],
                ["series", {
                        settings: [
                            [
                                settingsMap.get("entity"), settingsMap.get("value"),
                                settingsMap.get("entities"), settingsMap.get("entitygroup"),
                                settingsMap.get("entityexpression"),
                            ],
                            [
                                settingsMap.get("metric"), settingsMap.get("value"),
                                settingsMap.get("table"), settingsMap.get("attribute"),
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
                            [settingsMap.get("type")],
                        ],
                    }],
                ["dropdown", {
                        settings: [
                            [settingsMap.get("onchange"), settingsMap.get("changefield")],
                        ],
                    }],
                ["node", {
                        settings: [
                            [settingsMap.get("id")],
                        ],
                    }],
            ]);
        };
        /**
         * @returns array of parent sections for the section
         */
        ResourcesProviderBase.getParents = function (section) {
            var e_1, _a;
            var parents = [];
            var found = ResourcesProviderBase.parentSections.get(section);
            if (found !== undefined) {
                try {
                    for (var found_1 = __values(found), found_1_1 = found_1.next(); !found_1_1.done; found_1_1 = found_1.next()) {
                        var father = found_1_1.value;
                        // JS recursion is not tail-optimized, replace if possible
                        parents = parents.concat(father, this.getParents(father));
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (found_1_1 && !found_1_1.done && (_a = found_1.return)) _a.call(found_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return parents;
        };
        /**
         * @returns true if the current section is nested in the previous section
         */
        ResourcesProviderBase.isNestedToPrevious = function (currentName, previousName) {
            if (currentName === undefined || previousName === undefined) {
                return false;
            }
            return ResourcesProviderBase.getParents(currentName).includes(previousName);
        };
        /**
         * Tests if the provided setting complete or not
         * @param setting the setting to test
         * @returns true, if setting is complete, false otherwise
         */
        ResourcesProviderBase.isCompleteSetting = function (setting) {
            return setting !== undefined &&
                setting.displayName !== undefined &&
                setting.type !== undefined &&
                setting.example !== undefined;
        };
        /**
         * Clears the passed argument and looks for a setting with the same name
         * @param name name of the wanted setting
         * @param range TextRange of the setting in text.
         * @returns the wanted setting or undefined if not found
         */
        ResourcesProviderBase.prototype.getSetting = function (name, range) {
            var clearedName = setting_1.Setting.clearSetting(name);
            var defaultSetting = this.settingsMap.get(clearedName);
            if (defaultSetting === undefined) {
                return undefined;
            }
            var setting = new setting_1.Setting(defaultSetting);
            if (range) {
                setting.textRange = range;
            }
            return setting;
        };
        /**
         * @returns map of settings, key is the setting name, value is instance of Setting
         */
        ResourcesProviderBase.prototype.createSettingsMap = function () {
            var e_2, _a;
            var descriptions = this.readDescriptions();
            var settings = this.readSettings();
            var map = new Map();
            try {
                for (var settings_1 = __values(settings), settings_1_1 = settings_1.next(); !settings_1_1.done; settings_1_1 = settings_1.next()) {
                    var setting = settings_1_1.value;
                    if (ResourcesProviderBase.isCompleteSetting(setting)) {
                        var name_1 = setting_1.Setting.clearSetting(setting.displayName);
                        Object.assign(setting, { name: name_1, description: descriptions.get(name_1) });
                        var completeSetting = new setting_1.Setting(setting);
                        map.set(completeSetting.name, completeSetting);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (settings_1_1 && !settings_1_1.done && (_a = settings_1.return)) _a.call(settings_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return map;
        };
        ResourcesProviderBase.widgetRequirementsByType = new Map([
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
        ResourcesProviderBase.parentSections = new Map([
            ["widget", ["group", "configuration"]],
            ["series", ["widget", "link"]],
            ["tag", ["series"]],
            ["tags", ["series"]],
            ["column", ["widget"]],
            ["node", ["widget"]],
            ["link", ["widget"]],
            ["option", ["dropdown"]]
        ]);
        ResourcesProviderBase.sectionDepthMap = {
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
        ResourcesProviderBase.inheritableSections = new Set([
            "keys", "tags"
        ]);
        return ResourcesProviderBase;
    }());
    exports.ResourcesProviderBase = ResourcesProviderBase;
});
