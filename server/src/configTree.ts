import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { uselessScope } from "./messageUtil";
import { sectionDepthMap } from "./resources";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
import { createDiagnostic, getSetting } from "./util";

export interface Requirement {
    /**
     * setting name = possible values
     */
    conditions: Map<string, string[]>;
    checked: Setting;
    dependent: string | string[];
}

/**
 * If "checked" != null, the section will be checked for match to conditions;
 * if section matches conditions, "checked" setting is required for this section.
 *
 * If "checked" == null, the section will be checked for availability of any of "dependent";
 * if any dependent is declared in the section, than section will be checked for match to conditions.
 */
const relatedSettings: Requirement[] = [
    {
        checked: getSetting("thresholds"),
        conditions: new Map([
            ["type", ["calendar", "treemap", "gauge"]],
            ["mode", ["half", "default"]]
        ]),
        dependent: "colors"
    },
    {
        checked: getSetting("data-type"),
        conditions: new Map([
            ["type", ["chart"]],
            ["mode", ["column", "column-stack"]]
        ]),
        dependent: "forecast-style"
    },
    {
        checked: null,
        conditions: new Map([
            ["type", ["chart"]],
            ["mode", ["column-stack", "column"]]
        ]),
        dependent: ["negative-style", "current-period-style"]
    },
    {
        checked: null,
        conditions: new Map([
            ["type", ["chart"]],
            ["server-aggregate", ["false"]]
        ]),
        dependent: "moving-average"
    },
    {
        checked: null,
        conditions: new Map([
            ["type", ["calendar", "treemap", "gauge"]],
            ["mode", ["half", "default"]]
        ]),
        dependent: ["ticks", "color-range", "gradient-count"]
    },
    {
        checked: getSetting("attribute"), conditions: null, dependent: "table"
    },
    {
        checked: getSetting("table"), conditions: null, dependent: "attribute"
    },
    {
        checked: getSetting("column-alert-expression"), conditions: null, dependent: "column-alert-style"
    },
    {
        checked: getSetting("alert-expression"), conditions: null, dependent: "alert-style"
    },
    {
        checked: getSetting("alert-expression"), conditions: null, dependent: "link-alert-style"
    },
    {
        checked: getSetting("alert-expression"), conditions: null, dependent: "node-alert-style"
    },
    {
        checked: getSetting("icon-alert-expression"), conditions: null, dependent: "icon-alert-style"
    },
    {
        checked: getSetting("icon"), conditions: null, dependent: "icon-alert-expression"
    },
    {
        checked: getSetting("icon"), conditions: null, dependent: "icon-color"
    },
    {
        checked: getSetting("icon"), conditions: null, dependent: "icon-position"
    },
    {
        checked: getSetting("icon"), conditions: null, dependent: "icon-size"
    },
    {
        checked: getSetting("caption"), conditions: null, dependent: "caption-style"
    }
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

    public constructor(range: TextRange, settings: Setting[]) {
        this.range = range;
        this.name = range.text;
        this.settings = settings;
    }

    public getSetting(name: string): Setting | undefined {
        return this.settings.find(s => s.name === Setting.clearSetting(name));
    }
}

// tslint:disable-next-line:max-classes-per-file
export class ConfigTree {
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
            case 0: {
                this.root = section;
                break;
            }
            case 1: {
                this.root.children.push(section);
                section.parent = this.root;
                break;
            }
            case 2: {
                const group = this.root.children[this.root.children.length - 1];
                section.parent = group;
                section.parent.children.push(section);
                break;
            }
            case 3: {
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
            case 4: {
                section.parent = this.lastAdded;
                section.parent.children.push(section);
                break;
            }
        }

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
     * Bypasses tree and addes diagnostics if required.
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

    private sectionMatchConditions(section: Section, conditions: Map<string, string[]>): boolean {
        if (conditions === null) {
            return true;
        }
        for (let [settingName, allowedValues] of conditions) {
            const setting = this.getSetting(section, settingName);
            const currCondition = setting ? allowedValues.includes(setting.value) : true;
            if (!currCondition) {
                return false;
            }
        }
        return true;
    }

    /**
     * Searches setting in the parents starting from the startSection and ending root, returns the closest one.
     * @param settingName setting name
     * @param startSection node of subtree to search for settingName
     */
    private getSetting(startSection: Section, settingName: string): Setting | undefined {
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

    /**
     * Adds Diagnostic if section mathes condifitons and doesn't contain required ("checked") setting.
     */
    private checkSection(requirements: Requirement[], section: Section) {
        for (const req of requirements) {
            if (this.sectionMatchConditions(section, req.conditions)) {
                const checkedSetting = this.getSetting(section, req.checked.name);
                if (checkedSetting === undefined) {
                    this.diagnostics.push(createDiagnostic(section.range.range,
                        `${req.checked.displayName} is required if ${req.dependent} is specified`));
                } else if (req.checked.name === "thresholds") {
                    const colorsSetting = this.getSetting(section, "colors");
                    this.checkColorsMatchTreshold(colorsSetting, checkedSetting);
                }
            }
        }
    }

    /**
     * If section doesn't match at least one condition, adds new Diagnostic.
     */
    private checkDependentUseless(section: Section, requirement: Requirement, dependent: Setting) {
        for (let [settingName, allowedValues] of requirement.conditions) {
            let setting = this.getSetting(section, settingName);
            let value;
            if (setting === undefined) {
                /**
                 * Setting is not declared, so loooking for default value.
                 */
                setting = getSetting(settingName);
                if (setting !== undefined) {
                    value = setting.defaultValue;
                }
            } else {
                value = setting.value;
            }
            const currCondition = value ? allowedValues.includes(value.toString()) : true;
            if (!currCondition) {
                let msg: string[] = [];
                requirement.conditions.forEach((k, v) => {
                    if (k.length > 1) {
                        msg.push(`${v} is one of ${k.join(", ")}`);
                    } else {
                        msg.push(`${v} is ${k}`);
                    }
                });
                this.diagnostics.push(createDiagnostic(
                    dependent.textRange,
                    uselessScope(dependent.displayName, `${msg.join(", ")}`),
                    DiagnosticSeverity.Warning
                ));
                break;
            }
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
        if (requirement.checked === null) {
            this.checkDependentUseless(section, requirement, dependent);
            return;
        }
        const sectionNames = requirement.checked.section;
        const childSectionNames: string[] = typeof sectionNames === "string" ? [sectionNames] : sectionNames;
        if (sectionNames.includes(section.name)) {
            this.checkSection([requirement], section);
            return;
        }
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
