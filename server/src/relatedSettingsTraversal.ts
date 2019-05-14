import { Diagnostic } from "vscode-languageserver";
import { Section } from "./configTree";

export class RelatedSettingsTraversal {
    public diagnostic: Diagnostic[] = [];
    public series: Section[] = [];

    // Go through sections, find related settings and validate them
    public tranverse(node: Section) {
        this.getAllSeries(node);

        // Validate related settings of [series]
        for (let serie of this.series) {
            this.validateSectionSettings(serie);
        }
    }

    private getAllSeries(node: Section) {
        for (let section of node.children) {
            if (section.name === "series") {
                this.series.push(section);
            } else {
                this.getAllSeries(section);
            }
        }
    }

    private validateSectionSettings(section: Section) {
        Section.ValidationRules().forEach(validationRule => {
            let diag = validationRule.rule(section);
            if (diag) {
                this.diagnostic.push(diag);
            }
        });

        // Filter diagnostic from items with identical range
        this.diagnostic = [
            ...this.diagnostic.reduce((itemsMap, item) =>
            itemsMap.has(item.range) ? itemsMap : itemsMap.set(item.range, item),
            new Map()).values()
        ];
    }
}
