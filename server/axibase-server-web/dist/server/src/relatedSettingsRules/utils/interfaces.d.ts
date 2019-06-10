import { Diagnostic } from "vscode-languageserver";
import { Section } from "../../configTree/section";
import { Condition } from "./condition";
/**
 * Function, which performs check of the section.
 */
export declare type Check = (section: Section) => Diagnostic | Diagnostic[] | void;
export interface RelatedSettingsRule {
    name?: string;
    check: Check;
}
export interface Requirement {
    conditions?: Condition[];
    requiredSetting: string | string[];
}
