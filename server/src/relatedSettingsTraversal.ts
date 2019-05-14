import { Diagnostic } from "vscode-languageserver";
import { Section } from "./configTree";

export class RelatedSettingsTraversal {
    public diagnostic: Diagnostic[] = [];
    public series: Section[] = [];

    // Go through sections, find related settings and validate them
    public tranverse(node: Section) {
        this.getAllSeries(node);

        // Validate related settings of [series] and [widget]
        for (let serie of this.series) {
            this.validateSectionSettings(serie);
            this.validateSectionSettings(serie.parent);
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
        Section.ValidationRules(section).forEach(item => {
            let diag = item.rule();
            if (diag) {
                this.diagnostic.push(diag);
            }
        });
    }
}
