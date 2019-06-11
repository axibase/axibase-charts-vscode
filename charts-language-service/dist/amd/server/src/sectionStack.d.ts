import { Diagnostic } from "vscode-languageserver-types";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
interface DependencyResolveInfo {
    resolvedCount: number;
    unresolved: string[];
}
declare type AtLeastOneString = [string, ...string[]];
declare class SectionStackNode {
    range: TextRange;
    readonly dependencies: DependencyResolveInfo[];
    readonly settings: Setting[];
    constructor(range: TextRange);
    setRequiredSections(sections: string[][]): void;
    insertSetting(setting: Setting): void;
    getSetting(name: string): Setting | undefined;
    /**
     * Remove section from dependency list for every dependency option
     * @param name name of incoming section
     */
    resolveDependency(name: string): void;
    /**
     * True if dependencies for any dependency option are resolved
     */
    readonly dependenciesResolved: boolean;
    /**
     * A name of underlying section
     */
    readonly name: string;
    /**
     * A list of unresolved dependencies for section. If several options for
     * dependency list provisioned, return best of them. The best option is
     * an option with max number of resolved dependencies and min length of
     * unresolved.
     */
    readonly unresolved: string[];
}
export declare class SectionStack {
    private stack;
    insertSection(section: TextRange): Diagnostic | null;
    getLastSection(): SectionStackNode;
    finalize(): Diagnostic;
    requireSections(targetSection: string, ...sections: AtLeastOneString): void;
    setSectionRequirements(targetSection: string, sections: string[][]): void;
    insertCurrentSetting(setting: Setting): void;
    /**
     * Returns the setting by name.
     * @param name setting name
     * @param recursive if true searches setting in the whole stack and returns the closest one,
     * otherwise searches setting in the current section
     */
    getCurrentSetting(name: string, recursive?: boolean): Setting | undefined;
    getSectionSettings(section?: string, recursive?: boolean): Setting[];
    getSectionRange(section: string): TextRange | null;
    private createErrorDiagnostic;
    private checkDependenciesResolved;
    private checkAndGetDepth;
}
export {};
