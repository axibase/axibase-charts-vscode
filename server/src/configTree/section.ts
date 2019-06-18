import { Setting } from "language-service/dist";
import { Condition } from "../relatedSettingsRules/utils/condition";
import { TextRange } from "../textRange";

/**
 * See frequentlyUsed.
 */
export interface SectionScope {
    widgetType?: string;
    mode?: string;
}

/**
 * ConfigTree node.
 */
export class Section {
    public name: string;
    public settings: Setting[];
    public parent: Section;
    public children: Section[] = [];
    public range: TextRange;
    public scope: SectionScope = {};

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
             * We are not at [configuration].
             */
            this.scope = Object.create(this.parent.scope);
        }
        for (const setting of this.settings) {
            if (setting.name === "type") {
                this.scope.widgetType = setting.value;
            } else if (setting.name === "mode") {
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
    public getSetting(name: string): Setting | undefined {
        const cleared = Setting.clearSetting(name);
        return this.settings.find(s => s.name === cleared);
    }

    /**
     * Searches setting in the tree by it's displayName,
     * starting from the current section and ending root, returns the closest one.
     *
     * @param settingName - Setting.displayName
     * @returns Setting with displayname equal to `settingName`
     */
    public getSettingFromTree(settingName: string): Setting | undefined {
        let currentSection: Section = this;
        while (currentSection) {
            const value = currentSection.getSetting(settingName);
            if (value !== void 0) {
                return value;
            }
            currentSection = currentSection.parent;
        }
        return undefined;
    }

    public getScopeValue(settingName: string): string {
        return settingName === "type" ? this.scope.widgetType : this.scope.mode;
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
