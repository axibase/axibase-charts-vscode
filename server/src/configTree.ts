import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { ConfigTreeValidator } from "./configTreeValidator";
import { uselessScope } from "./messageUtil";
import { getRequirement } from "./relatedSettings";
import { Requirement } from "./requirement";
import { isNestedToPrevious, sectionDepthMap } from "./resources";
import { Section } from "./section";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
import { createDiagnostic, getSetting } from "./util";

export interface RelatedSettingsRule {
    name: string;
    rule: (section: Section, tree: ConfigTree) => Diagnostic | void;
}

export interface ValidationRule {
    name: string;
    rules: RelatedSettingsRule[];
}

/**
 * Checks related settings.
 */
export class ConfigTree {
    public diagnostics: Diagnostic[];
    private root: Section;
    private lastAddedParent: Section;
    private previous: Section;

    private configTreeValidator: ConfigTreeValidator = new ConfigTreeValidator();

    public constructor(diagnostics: Diagnostic[]) {
        this.diagnostics = diagnostics;
    }

    get getRoot() {
        return this.root;
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
            const requirement = getRequirement(setting.displayName);
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

        const diagnostic: Diagnostic[] =  this.configTreeValidator.validate(this);
        this.diagnostics.push(...diagnostic);
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
