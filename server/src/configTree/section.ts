import { Condition } from "../relatedSettingsRules/utils/condition";
import { Setting } from "../setting";
import { TextRange } from "../textRange";

/**
 * Settings, that are frequently used in conditions checks,
 * see requiredSettings.ts, uselessSettings.ts and date checks.
 */
const sectionScopeSettings: string[] = ["type", "mode", "endtime", "timezone"];

/**
 * ConfigTree node.
 */
export class Section {
    public name: string;
    public settings: Setting[];
    public parent: Section;
    public children: Section[] = [];
    public range: TextRange;
    /**
     * Caches frequently used settings to reduce search in tree.
     */
    private scope: Map<string, Setting> = new Map<string, Setting>();

    /**
     * @param range - The text (name of section) and the position of the text
     * @param settings - Section settings
     */
    public constructor(range: TextRange, settings: Setting[]) {
        this.range = range;
        this.name = range.text;
        this.settings = settings;
    }

    public applyScope() {
        if (this.parent !== undefined) {
            /**
             * We are not at [configuration]. Inherit parent scope.
             */
            this.scope = new Map(this.parent.scope);
        }
        for (const setting of this.settings) {
            /**
             * Override parent scope.
             */
            if (sectionScopeSettings.includes(setting.name)) {
                this.scope.set(setting.name, setting);
            }
        }
    }

    /**
     * Returns setting from this section by it's displayName.
     *
     * @param name - Setting.displayName
     * @returns Setting with displayname equal to `settingName`
     */
    public getSetting(name: string): Setting | undefined {
        const cleared = Setting.clearSetting(name);
        return this.settings.find(s => s.name === cleared);
    }

    /**
     * Returns setting with specified display name. If setting is frequently used, tries to get it from section's scope,
     * otherwise searches setting in the tree by it's displayName,
     * starting from the current section and ending root, returns the closest one.
     *
     * @param settingName - Setting.displayName
     * @returns Setting with displayname equal to `settingName`
     */
    public getSettingFromTree(settingName: string): Setting | undefined {
        let value = this.getScopeSetting(settingName);
        if (value != null) {
            return value;
        }
        let currentSection: Section = this;
        while (currentSection) {
            value = currentSection.getSetting(settingName);
            if (value !== void 0) {
                return value;
            }
            currentSection = currentSection.parent;
        }
        return undefined;
    }

    public getScopeSetting(settingName: string): Setting {
        const cleared = Setting.clearSetting(settingName);
        return this.scope.get(cleared);
    }

    /**
     * Returns true if section passes all of conditions, otherwise returns false.
     *
     * @param conditions - Array of conditions, for which section must be checked
     * @returns Result of `conditions` checks.
     */
    public matchesConditions(conditions: Condition[]): boolean {
        const section: Section = this;

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
