import { Diagnostic } from "vscode-languageserver";
import { ConfigTree } from "../../configTree";
import { Section } from "../../section";

export interface RelatedSettingsRule {
    name: string;
    rule: (section: Section, tree: ConfigTree) => Diagnostic | void;
}

export interface ValidationRule {
    name: string;
    rules: RelatedSettingsRule[];
}
