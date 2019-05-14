import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { incorrectColors, uselessScope } from "./messageUtil";
import { relatedSettings } from "./relatedSettings";
import { RelatedSettingsTraversal } from "./relatedSettingsTraversal";
import {
    Condition, Requirement,
    sectionMatchConditionRequired, SectionScope
} from "./requirement";
import { isNestedToPrevious, sectionDepthMap } from "./resources";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
import { createDiagnostic, getSetting } from "./util";

interface RelatedSettingsRule {
    name: string;
    rule: (section: Section) => Diagnostic | void;
}

// tslint:disable-next-line:max-classes-per-file
export class Section {
    public static ValidationRules(): RelatedSettingsRule[] {
        const rules: RelatedSettingsRule[] = [
            {
                name: "Validate start-time and end-time",
                rule(section: Section): Diagnostic | void {
                    const end = section.getSettingFromTree("end-time");
                    const start = section.getSettingFromTree("start-time");

                    if (end === undefined || start === undefined) {
                        return;
                    }

                    if (start.value >= end.value) {
                        return createDiagnostic(
                            end.textRange,
                            `${end.displayName} must be greater than ${start.displayName}`,
                            DiagnosticSeverity.Error
                        );
                    }
                }
            },
            {
                name: "Validate forecast-horizon-end-time and end-time",
                rule(section: Section): Diagnostic | void {
                    let forecast = section.getSettingFromTree("forecast-horizon-end-time");
                    let end = section.getSettingFromTree("end-time");

                    if (end === undefined || forecast === undefined) {
                        return;
                    }

                    if (end.value >= forecast.value) {
                        return createDiagnostic(
                            end.textRange,
                            `${forecast.displayName} must be greater than ${end.displayName}`,
                            DiagnosticSeverity.Error
                        );
                    }
                }
            },
            {
                name: "Check colors match threshold",
                rule(section: Section): Diagnostic | void {
                    let colorsValues;
                    let thresholdsValues;

                    const colorsSetting = section.getSettingFromTree("colors");
                    const thresholdsSetting = section.getSettingFromTree("thresholds");

                    if (colorsSetting === undefined || thresholdsSetting === undefined) {
                        return;
                    }

                    if (!section.sectionMatchConditions([
                        sectionMatchConditionRequired("type", ["calendar", "treemap", "gauge"]),
                        sectionMatchConditionRequired("mode", ["half", "default"])
                    ])) {
                        return;
                    }

                    if (colorsSetting.values.length > 0) {
                        colorsSetting.values.push(colorsSetting.value);
                        colorsValues = colorsSetting.values;
                    } else {
                        /**
                         * Converts 1) -> 2):
                         * 1) colors = rgb(247,251,255), rgb(222,235,247), rgb(198,219,239)
                         * 2) colors = rgb, rgb, rgb
                         */
                        colorsValues = colorsSetting.value.replace(/(\s*\d{3}\s*,?)/g, "");
                        colorsValues = colorsValues.split(",").filter(s => s.trim() !== "");
                    }
                    if (thresholdsSetting.values.length > 0) {
                        thresholdsSetting.values.push(thresholdsSetting.value);
                        thresholdsValues = thresholdsSetting.values;
                    } else {
                        thresholdsValues = thresholdsSetting.value.split(",").filter(s => s.trim() !== "");
                    }

                    const expected = thresholdsValues.length - 1;
                    if (colorsValues.length !== expected) {
                        return createDiagnostic(colorsSetting.textRange,
                            incorrectColors(`${colorsValues.length}`, `${expected}`));
                    }
                }
            }
        ];

        return rules;
    }

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

/**
 * Checks related settings.
 */
// tslint:disable-next-line:max-classes-per-file
export class ConfigTree {
    public diagnostics: Diagnostic[];
    private root: Section;
    private lastAddedParent: Section;
    private previous: Section;

    private relatedSettingsTraversal: RelatedSettingsTraversal = new RelatedSettingsTraversal();

    public constructor(diagnostics: Diagnostic[]) {
        this.diagnostics = diagnostics;
    }

    /**
     * Adds section to tree. Checks section for non-applicable settings and declares requirements for children.
     * Doesn't alert if the section is out of order, this check is performed by SectionStack.
     * @param range The text (name of section) and the position of the text
     * @param settings Section settings
     */
    public addSection(range: TextRange, settings: Setting[]) {
        const section = new Section(range, settings);
        const depth: number = sectionDepthMap[range.text];
        if (depth > 0 && !this.root) {
            return;
        }
        switch (depth) {
            case 0: { // [configuration]
                this.root = section;
                this.lastAddedParent = section;
                break;
            }
            case 1: { // [group]
                section.parent = this.root;
                this.lastAddedParent = section;
                break;
            }
            case 2: { // [widget]
                const group = this.root.children[this.root.children.length - 1];
                if (!group) {
                    return;
                }
                section.parent = group;
                this.lastAddedParent = section;
                break;
            }
            case 3: { // [series], [dropdown], [column], ...
                if (this.lastAddedParent && this.lastAddedParent.name === "column" && range.text === "series") {
                    section.parent = this.lastAddedParent;
                } else {
                    const group = this.root.children[this.root.children.length - 1];
                    if (!group) {
                        return;
                    }
                    const widget = group.children[group.children.length - 1];
                    if (!widget) {
                        return;
                    }
                    section.parent = widget;
                    this.lastAddedParent = section;
                }
                break;
            }
            case 4: { // [option], [properties], [tags]
                if (isNestedToPrevious(range.text, this.previous.name)) {
                    section.parent = this.previous;
                } else {
                    section.parent = this.lastAddedParent;
                }
                if (!section.parent) {
                    return;
                }
                break;
            }
        }
        if (section.parent) {
            // We are not in [configuration]
            section.parent.children.push(section);
        }
        this.previous = section;
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
     * Bypasses the tree and adds diagnostics about not applicable settings
     * or absent required setting.
     */
    public goThroughTree() {
        if (!this.root) {
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

        this.relatedSettingsTraversal.tranverse(this.root);

        if (this.relatedSettingsTraversal.diagnostic.length) {
            this.diagnostics.push(...this.relatedSettingsTraversal.diagnostic);
        }
    }

    /**
     * Returns object from relatedSettings based on setting.displayName.
     * @param settingName setting.displayName
     */
    private getRequirement(settingName: string): Requirement | undefined {
        return relatedSettings.find(req => {
            return Array.isArray(req.dependent) ? req.dependent.includes(settingName) : req.dependent === settingName;
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

    /**
     * Adds Diagnostic if section matches condifitons and doesn't contain required ("checked") setting.
     */
    private checkSection(requirements: Requirement[], section: Section) {
        for (const req of requirements) {
            if (section.sectionMatchConditions(req.conditions)) {
                if (req.requiredIfConditions) {
                    const required = req.requiredIfConditions;
                    const checkedSetting = section.getSettingFromTree(required);
                    const defaultValue = getSetting(required).defaultValue;
                    if (checkedSetting == null && defaultValue == null) {
                        this.diagnostics.push(createDiagnostic(section.range.range,
                            `${required} is required if ${req.dependent} is specified`));
                        return;
                    }
                    switch (required) {
                        case "forecast-ssa-decompose-eigentriple-limit": {
                            const groupAutoCount = section.getSettingFromTree("forecast-ssa-group-auto-count");
                            const eigentripleLimitValue = checkedSetting ? checkedSetting.value : defaultValue;
                            if (eigentripleLimitValue <= groupAutoCount.value) {
                                this.diagnostics.push(createDiagnostic(groupAutoCount.textRange,
                                    `forecast-ssa-group-auto-count ` +
                                    `must be less than forecast-ssa-decompose-eigentriple-limit (default 0)`));
                            }
                            break;
                        }
                    }
                } else {
                    const anyRequiredIsSpecified = req.requiredAnyIfConditions.some(
                        reqSetting => section.getSettingFromTree(reqSetting) != null);
                    if (!anyRequiredIsSpecified) {
                        this.diagnostics.push(createDiagnostic(section.range.range,
                            `${req.dependent} has effect only with one of the following:
 * ${req.requiredAnyIfConditions.join("\n * ")}`));
                    }
                }
            }
        }
    }

    /**
     * If section doesn't match at least one condition, adds new Diagnostic about dependent.
     */
    private checkDependentUseless(section: Section, requirement: Requirement, dependent: Setting) {
        const msg: string[] = requirement.conditions.map(condition => condition(section) as string).filter(m => m);
        if (msg.length > 0) {
            this.diagnostics.push(createDiagnostic(
                dependent.textRange,
                uselessScope(dependent.displayName, `${msg.join(", ")}`),
                DiagnosticSeverity.Warning
            ));
        }
    }

    /**
     * @param requirement Requirement for `dependent` setting.
     * @param section Section, where `dependent` is declared.
     * @param dependent Setting, which requires other settings or which must be checked for applicability.
     */
    private checkCurrentAndSetRequirementsForChildren(requirement: Requirement, section: Section, dependent: Setting) {
        if (requirement.requiredIfConditions == null && requirement.requiredAnyIfConditions == null) {
            this.checkDependentUseless(section, requirement, dependent);
            return;
        }
        let requiredSetting;
        if (requirement.requiredIfConditions) {
            requiredSetting = getSetting(requirement.requiredIfConditions);
        } else {
            /**
             * If requirement.requiredIfConditions == null, then requiredAnyIfConditions != null.
             * It's supposed that all settings from `requiredAnyIfConditions` have the same sections,
             * that's why only first section is used here.
             */
            requiredSetting = getSetting(requirement.requiredAnyIfConditions[0]);
        }

        const sectionNames = requiredSetting.section;
        if (!sectionNames) {
            return;
        }
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
