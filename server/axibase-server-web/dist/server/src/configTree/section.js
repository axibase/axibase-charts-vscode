define(["require", "exports", "../setting"], function (require, exports, setting_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * ConfigTree node.
     */
    class Section {
        /**
         * @param range - The text (name of section) and the position of the text
         * @param settings - Section settings
         */
        constructor(range, settings) {
            this.children = [];
            this.scope = {};
            this.range = range;
            this.name = range.text;
            this.settings = settings;
        }
        applyScope() {
            if (this.parent !== undefined) {
                /**
                 * We are not at [configuration].
                 */
                this.scope = Object.create(this.parent.scope);
            }
            for (const setting of this.settings) {
                if (setting.name === "type") {
                    this.scope.widgetType = setting.value;
                }
                else if (setting.name === "mode") {
                    this.scope.mode = setting.value;
                }
            }
        }
        /**
         * Returns setting from this section by it's displayName.
         *
         * @param name - Setting.displayName
         * @returns Setting with displayname equal to `settingName`
         */
        getSetting(name) {
            const cleared = setting_1.Setting.clearSetting(name);
            return this.settings.find(s => s.name === cleared);
        }
        /**
         * Searches setting in the tree by it's displayName,
         * starting from the current section and ending root, returns the closest one.
         *
         * @param settingName - Setting.displayName
         * @returns Setting with displayname equal to `settingName`
         */
        getSettingFromTree(settingName) {
            let currentSection = this;
            while (currentSection) {
                const value = currentSection.getSetting(settingName);
                if (value !== void 0) {
                    return value;
                }
                currentSection = currentSection.parent;
            }
            return undefined;
        }
        getScopeValue(settingName) {
            return settingName === "type" ? this.scope.widgetType : this.scope.mode;
        }
        /**
         * Returns true if section passes all of conditions, otherwise returns false.
         *
         * @param conditions - Array of conditions, for which section must be checked
         * @returns Result of `conditions` checks.
         */
        matchesConditions(conditions) {
            const section = this;
            if (conditions === undefined) {
                return true;
            }
            for (const condition of conditions) {
                const currCondition = condition(section);
                if (!currCondition) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.Section = Section;
});
