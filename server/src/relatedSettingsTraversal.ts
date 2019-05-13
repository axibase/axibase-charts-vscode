import { Diagnostic } from "vscode-languageserver";
import { Section } from "./configTree";

export class RelatedSettingsTraversal {
    public diagnostic: Diagnostic[] = [];
    public series: Section[] = [];

    public tranverse(node: Section) {
        this.getAllSeries(node);

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
        Section.ValidationRules(section).forEach(rule => {
            let diag = rule(section, this);
            if (diag) {
                this.diagnostic.push(diag);
            }
        });
    }
}
