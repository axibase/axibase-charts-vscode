import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { uselessScope } from "./messageUtil";
import { Condition, Requirement, SectionScope } from "./requirement";
import { sectionDepthMap } from "./resources";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
import { createDiagnostic, getSetting } from "./util";

/**
 * If requiredIfConditions !== null, the section will be checked for match to conditions;
 * if section matches conditions, requiredIfConditions setting is required for this section.
 *
 * If requiredIfConditions == null, the section will be checked for applicability of any of "dependent";
 * if any dependent is declared in the section, than section will be checked for match to conditions.
 */
const relatedSettings: Requirement[] = [
    new Requirement(
        "colors",
        getSetting("thresholds"),
        new Map([
            ["type", ["calendar", "treemap", "gauge"]],
            ["mode", ["half", "default"]]
        ])
    ),
    new Requirement(
        "forecast-style",
        getSetting("data-type"),
        new Map([
            ["type", ["chart"]],
            ["mode", ["column", "column-stack"]]
        ])
    ),
    new Requirement(
        ["negative-style", "current-period-style"],
        null,
        new Map([
            ["type", ["chart"]],
            ["mode", ["column-stack", "column"]]
        ])
    ),
    new Requirement(
        "moving-average",
        null,
        new Map([
            ["type", ["chart"]],
            ["server-aggregate", ["false"]]
        ])
    ),
    new Requirement(
        ["ticks", "color-range", "gradient-count"],
        null,
        new Map([
            ["type", ["calendar", "treemap", "gauge"]],
            ["mode", ["half", "default"]]
        ])
    ),
    new Requirement(
        "table", getSetting("attribute")
    ),
    new Requirement(
        "attribute", getSetting("table")
    ),
    new Requirement(
        "column-alert-style", getSetting("column-alert-expression")
    ),
    new Requirement(
        "alert-style", getSetting("alert-expression")
    ),
    new Requirement(
        "link-alert-style", getSetting("alert-expression")
    ),
    new Requirement(
        "node-alert-style", getSetting("alert-expression")
    ),
    new Requirement(
        "icon-alert-style", getSetting("icon-alert-expression")
    ),
    new Requirement(
        "icon-alert-expression", getSetting("icon")
    ),
    new Requirement(
        "icon-color", getSetting("icon")
    ),
    new Requirement(
        "icon-position", getSetting("icon")
    ),
    new Requirement(
        "icon-size", getSetting("icon")
    ),
    new Requirement(
        "caption-style", getSetting("caption")
    )
];

class Section {

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

    public getScopeValue(settingName: string): string {
        return settingName === "type" ? this.scope.widgetType : this.scope.mode;
    }
}

/**
 * checks related settings.
 */
// tslint:disable-next-line:max-classes-per-file
export class ConfigTree {

    /**
     * Searches setting in the parents starting from the startSection and ending root, returns the closest one.
     * @param settingName setting name
     * @param startSection node of subtree to search for settingName
     */
    public static getSetting(startSection: Section, settingName: string): Setting | undefined {
        let currentSection = startSection;
        do {
            let value = currentSection.getSetting(settingName);
            if (value !== void 0) {
                return value;
            }
            currentSection = currentSection.parent;
        }
        while (currentSection !== undefined);

        return undefined;
    }

    public diagnostics: Diagnostic[];
    private root: Section;
    private lastAdded: Section = null;

    public constructor(diagnostics: Diagnostic[]) {
        this.diagnostics = diagnostics;
    }

    public addSection(range: TextRange, settings: Setting[]) {
        const section = new Section(range, settings);
        const depth: number = sectionDepthMap[range.text];
        switch (depth) {
            case 0: { // [configuration]
                this.root = section;
                break;
            }
            case 1: { // [group]
                this.root.children.push(section);
                section.parent = this.root;
                break;
            }
            case 2: { // [widget]
                const group = this.root.children[this.root.children.length - 1];
                section.parent = group;
                section.parent.children.push(section);
                break;
            }
            case 3: { // [series], [dropdown], [column], ...
                if (this.lastAdded && this.lastAdded.name === "column" && range.text === "series") {
                    section.parent = this.lastAdded;
                } else {
                    const group = this.root.children[this.root.children.length - 1];
                    const widget = group.children[group.children.length - 1];
                    section.parent = widget;
                    this.lastAdded = section;
                }
                section.parent.children.push(section);
                break;
            }
            case 4: { // [option], [properties], ...
                section.parent = this.lastAdded;
                section.parent.children.push(section);
                break;
            }
        }
        section.applyScope();

        for (const setting of settings) {
            const requirement = this.getRequirement(setting.displayName);
            if (requirement !== undefined) {
                /**
                 * Section contains dependent which can be useless or requires additional setting.
                 */
                this.checkCurrentAndSetRequirementsForChildren(requirement, section, setting);
            }
        }
    }

    /**
     * Bypasses the tree and addes diagnostics about not applicable settings
     * or absent required setting.
     */
    public goThroughTree() {
        if (this.root === undefined) {
            return;
        }
        let currentLevel: Section[] = [this.root];
        while (currentLevel.length > 0) {
            let childAccumulator: Section[] = [];
            for (const parentSection of currentLevel) {
                for (let [sectionToCheck, reqsForSection] of parentSection.requirementsForChildren) {
                    this.checkAllChildren(sectionToCheck, reqsForSection, parentSection);
                }
                childAccumulator.push(...parentSection.children);
            }
            currentLevel = childAccumulator;
        }
    }

    /**
     * Returns object from relatedSettings based on setting.displayName.
     * @param settingName setting.displayName
     */
    private getRequirement(settingName: string): Requirement | undefined {
        return relatedSettings.find(req => {
            if (typeof req.dependent === "string") {
                return req.dependent === settingName;
            }
            return req.dependent.includes(settingName);
        });
    }

    /**
     * Checks each children of the section recursevly.
     * @param targetSectionName name of the section, which need to be checked
     * @param requirements array of requirements for the section, which need to be checked
     * @param startSection root of subtree to search for targetSection
     */
    private checkAllChildren(targetSectionName: string, requirements: Requirement[], startSection: Section) {
        if (startSection.children.length < 1) {
            return;
        }
        for (const child of startSection.children) {
            if (child.name === targetSectionName) {
                this.checkSection(requirements, child);
                continue;
            }
            this.checkAllChildren(targetSectionName, requirements, child);
        }
    }

    private sectionMatchConditions(section: Section, conditions: Condition[]): boolean {
        if (conditions.length === 0) {
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

    /**
     * Adds Diagnostic if section mathes condifitons and doesn't contain required ("checked") setting.
     */
    private checkSection(requirements: Requirement[], section: Section) {
        for (const req of requirements) {
            if (this.sectionMatchConditions(section, req.conditions)) {
                const checkedSetting = ConfigTree.getSetting(section, req.requiredIfConditions.name);
                if (checkedSetting === undefined) {
                    this.diagnostics.push(createDiagnostic(section.range.range,
                        `${req.requiredIfConditions.displayName} is required if ${req.dependent} is specified`));
                } else if (req.requiredIfConditions.name === "thresholds") {
                    const colorsSetting = ConfigTree.getSetting(section, "colors");
                    this.checkColorsMatchTreshold(colorsSetting, checkedSetting);
                }
            }
        }
    }

    /**
     * If section doesn't match at least one condition, adds new Diagnostic about dependent.
     */
    private checkDependentUseless(section: Section, requirement: Requirement, dependent: Setting) {
        const msg: string[] = [];
        for (const condition of requirement.conditions) {
            const infoMessage: string = condition(section) as string;
            if (infoMessage !== null) {
                msg.push(infoMessage);
            }
        }
        if (msg.length > 0) {
            this.diagnostics.push(createDiagnostic(
                dependent.textRange,
                uselessScope(dependent.displayName, `${msg.join(", ")}`),
                DiagnosticSeverity.Warning
            ));
        }
    }

    /**
     * Check the relationship between thresholds and colors:
     * in "gauge", "calendar", "treemap" number of colors (if specified) must be equal to number of thresholds minus 1.
     */
    private checkColorsMatchTreshold(colorsSetting: Setting, thresholdsSetting: Setting) {
        const thresholdsValue = thresholdsSetting.value;
        const colorsValue = colorsSetting.value;
        if (colorsValue && thresholdsValue) {
            if (colorsValue.split(/[^\d],[^\d]/g).length !== (thresholdsValue.split(",").length - 1)) {
                this.diagnostics.push(createDiagnostic(colorsSetting.textRange,
                    `Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.`));
            }
        }
    }

    private checkCurrentAndSetRequirementsForChildren(requirement: Requirement, section: Section, dependent: Setting) {
        if (requirement.requiredIfConditions === null) {
            this.checkDependentUseless(section, requirement, dependent);
            return;
        }
        const sectionNames = requirement.requiredIfConditions.section;
        if (sectionNames.includes(section.name)) {
            // check current
            this.checkSection([requirement], section);
            return;
        }
        const childSectionNames: string[] = typeof sectionNames === "string" ? [sectionNames] : sectionNames;
        for (const secName of childSectionNames) {
            const reqs = section.requirementsForChildren.get(secName);
            if (reqs) {
                reqs.push(requirement);
            } else {
                section.requirementsForChildren.set(secName, [requirement]);
            }
        }
    }
}
