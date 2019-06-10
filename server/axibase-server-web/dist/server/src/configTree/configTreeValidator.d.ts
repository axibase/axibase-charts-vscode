import { Diagnostic } from "vscode-languageserver-types";
import { ConfigTree } from "./configTree";
export declare class ConfigTreeValidator {
    /**
     * Goes through validationRules and performs checks on corresponding sections.
     *
     * @param сonfigTree - Configuration tree
     * @returns Diagnosics about problems in sections
     */
    static validate(сonfigTree: ConfigTree): Diagnostic[];
}
