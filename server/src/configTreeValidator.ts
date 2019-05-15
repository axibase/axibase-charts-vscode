import { Diagnostic } from "vscode-languageserver";
import { ConfigTree, RelatedSettingsRule, Section } from "./configTree";
import validationRules from "./validationRules";

export class ConfigTreeValidator {
    public diagnostic: Diagnostic[] = [];
    private sectionNames: string[] = ["series", "dropdown"];

    // Go through sections, find related settings and validate them
    public validate(сonfigTree: ConfigTree): Diagnostic[] {
        const validatingWalker = new ConfigTreeWalker(сonfigTree);
        const diagnostics: Diagnostic[] = [];

        this.sectionNames.forEach(sectionName => {
            const sectionDiagnostic = validatingWalker.walk(sectionName);
            diagnostics.push(...sectionDiagnostic);
        });

        return diagnostics;
    }
}

// tslint:disable-next-line:max-classes-per-file
class ConfigTreeWalker {
    public tree: ConfigTree;
    private sections: Section[] = [];

    constructor(сonfigTree: ConfigTree) {
        this.tree = сonfigTree;
    }

    // Find all sections with the given name, traverse through them and validate
    public walk(sectionName: string): Diagnostic[] {
        let diagnostics: Diagnostic[] = [];
        const rules = this.getRules(sectionName);
        this.getAllSectionsOfType(this.tree.getRoot, sectionName);
        this.sections.forEach(section => {
            rules.forEach(rule => {
                let diag = rule.rule(section, this.tree);
                if (diag) {
                    diagnostics.push(diag);
                }
            });
        });

        // Remove duplicates if diagnostic items have the same range
        diagnostics = [
            ...diagnostics.reduce((allItems, item) =>
            allItems.has(item.range) ? allItems : allItems.set(item.range, item),
            new Map()).values()
        ];

        return diagnostics;
    }

    // Find all sections with the given name recursively, start from root
    private getAllSectionsOfType(node: Section, sectionName: string) {
        for (let section of node.children) {
            if (section.name === sectionName) {
                this.sections.push(section);
            } else {
                this.getAllSectionsOfType(section, sectionName);
            }
        }
    }

    // Get rules by section name
    private getRules(sectionName: string): RelatedSettingsRule[] {
        let sectionRules: RelatedSettingsRule[] = [];

        validationRules.forEach(validationRule => {
            if (validationRule.name === sectionName) {
                sectionRules = validationRule.rules;
            }
        });

        return sectionRules;
    }
}
