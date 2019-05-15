import { Diagnostic } from "vscode-languageserver";
import { ConfigTreeValidator } from "./configTreeValidator";
import { getRequirement, RequiredSettingsValidator } from "./requiredSettingsValidator";
import { isNestedToPrevious, sectionDepthMap } from "./resources";
import { Section } from "./section";
import { Setting } from "./setting";
import { TextRange } from "./textRange";

/**
 * Builds config tree structure
 */
export class ConfigTree {
    public diagnostics: Diagnostic[];
    private root: Section;
    private lastAddedParent: Section;
    private previous: Section;

    private configTreeValidator: ConfigTreeValidator = new ConfigTreeValidator();
    private requiredSettingsValidator: RequiredSettingsValidator = new RequiredSettingsValidator();

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
                this.requiredSettingsValidator.checkCurrentAndSetRequirementsForChildren(requirement, section, setting);
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
                    this.requiredSettingsValidator.checkAllChildren(sectionToCheck, reqsForSection, parentSection);
                }
                childAccumulator.push(...parentSection.children);
            }
            currentLevel = childAccumulator;
        }
        // Adds diagnostic about useless or missing required settings
        this.diagnostics.push(...this.requiredSettingsValidator.diagnostics);
        // Adds diagnostic of settings validation
        const diagnostic: Diagnostic[] =  this.configTreeValidator.validate(this);
        this.diagnostics.push(...diagnostic);
    }
}
