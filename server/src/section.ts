import {
    Condition, Requirement, SectionScope
} from "./requirement";
import { Setting } from "./setting";
import { TextRange } from "./textRange";

export class Section {
    public name: string;
    public settings: Setting[];
    public parent: Section;
    public children: Section[] = [];
    public range: TextRange;
    /**
     * section name = requirements for this section
     */
    public requirementsForChildren: Map<string, Requirement[]> = new Map();
    public scope: SectionScope = {};

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

    public getSetting(name: string): Setting | undefined {
        const cleared = Setting.clearSetting(name);
        return this.settings.find(s => s.name === cleared);
    }

    /**
     * Searches setting in the parents starting from the startSection and ending root, returns the closest one.
     * @param settingName Setting name
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

    public sectionMatchConditions(conditions: Condition[]): boolean {
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
