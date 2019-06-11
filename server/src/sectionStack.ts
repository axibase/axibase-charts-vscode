/// <amd-module name="SectionStackNode"/>
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode-languageserver-types";
import { inheritableSections, requiredSectionSettingsMap, sectionDepthMap } from "./resources";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
import { createDiagnostic } from "./util";

interface DependencyResolveInfo {
    resolvedCount: number;
    unresolved: string[];
}

type AtLeastOneString = [string, ...string[]];

class SectionStackNode {
    public readonly dependencies: DependencyResolveInfo[] = [];
    public readonly settings: Setting[] = [];

    public constructor(public range: TextRange) {
        const deps = requiredSectionSettingsMap.get(this.name);
        if (deps && deps.sections) {
            this.setRequiredSections(deps.sections);
        }
    }

    public setRequiredSections(sections: string[][]) {
        this.dependencies.splice(0, this.dependencies.length);
        for (const option of sections) {
            this.dependencies.push({
                resolvedCount: 0,
                unresolved: option.slice(),
            });
        }
    }

    public insertSetting(setting: Setting) {
        this.settings.push(setting);
    }

    public getSetting(name: string): Setting | undefined {
        const cleared = Setting.clearSetting(name);
        return this.settings.find(s => s.name === cleared);
    }

    /**
     * Remove section from dependency list for every dependency option
     * @param name name of incoming section
     */
    public resolveDependency(name: string): void {
        for (const option of this.dependencies) {
            const index: number = option.unresolved.indexOf(name);
            if (index >= 0) {
                option.resolvedCount++;
                option.unresolved.splice(index, 1);
            }
        }
    }

    /**
     * True if dependencies for any dependency option are resolved
     */
    public get dependenciesResolved(): boolean {
        if (this.dependencies.length === 0) {
            return true;
        }

        return this.dependencies.some((deps) => deps.unresolved.length === 0);
    }

    /**
     * A name of underlying section
     */
    public get name(): string {
        return this.range.text;
    }

    /**
     * A list of unresolved dependencies for section. If several options for
     * dependency list provisioned, return best of them. The best option is
     * an option with max number of resolved dependencies and min length of
     * unresolved.
     */
    public get unresolved(): string[] {
        if (this.dependencies.length === 0) {
            return [];
        }

        const bestDependencyOption: DependencyResolveInfo = this.dependencies
            .reduce((best, dep) => {
                if (dep.resolvedCount > best.resolvedCount) {
                    return dep;
                }
                if (dep.unresolved.length < best.unresolved.length) {
                    return dep;
                }

                return best;
            });

        return bestDependencyOption.unresolved;
    }
}

/**
 * A null object to prevent multiple errors on missing root section
 */
const DummySectionStackNode: SectionStackNode & { [Symbol.toStringTag]: string } = {
    dependencies: [],
    dependenciesResolved: true,
    name: "",
    range: new TextRange("", Range.create(Position.create(0, 0), Position.create(0, 0))),
    settings: [],
    unresolved: [],

    resolveDependency() { /* void */ },
    setRequiredSections() { /* void */ },
    getSetting() { return undefined; },
    insertSetting() { /* void */ },
    [Symbol.toStringTag]: "DummySectionStackNode",
};

// tslint:disable-next-line:max-classes-per-file
export class SectionStack {
    private stack: SectionStackNode[] = [];

    public insertSection(section: TextRange): Diagnostic | null {
        const sectionName: string = section.text;
        let [depth, error] = this.checkAndGetDepth(section);
        if (depth < this.stack.length) {
            if (depth === 0) {
                // We are attempting to declare [configuration] twice
                return this.createErrorDiagnostic(section, `Unexpected section [${sectionName}].`);
            }

            // Pop stack, check dependencies of popped resolved
            error = this.checkDependenciesResolved(depth);
            this.stack.splice(depth, this.stack.length - depth);
        }

        for (let i = this.stack.length; i < depth; i++) {
            this.stack.push(DummySectionStackNode);
        }

        for (const entry of this.stack) {
            entry.resolveDependency(sectionName);
        }

        this.stack.push(new SectionStackNode(section));

        return error;
    }

    public getLastSection(): SectionStackNode {
        return this.stack[this.stack.length - 1];
    }

    public finalize(): Diagnostic {
        let err = this.checkDependenciesResolved(0);
        this.stack = [];
        return err;
    }

    public requireSections(targetSection: string, ...sections: AtLeastOneString) {
        let target = this.stack.find(s => s.name === targetSection);
        if (target) {
            for (let dep of target.dependencies) {
                for (let section of sections) {
                    if (!dep.unresolved.includes(section)) {
                        dep.unresolved.push(section);
                    }
                }
            }
            if (target.dependencies.length === 0) {
                target.dependencies.push({
                    resolvedCount: 0,
                    unresolved: sections,
                });
            }
        }
    }

    public setSectionRequirements(targetSection: string, sections: string[][]) {
        let target = this.stack.find(s => s.name === targetSection);
        if (target) {
            target.setRequiredSections(sections);
        }
    }

    public insertCurrentSetting(setting: Setting) {
        if (this.stack.length > 0) {
            let target = this.stack[this.stack.length - 1];
            target.insertSetting(setting);
        }
    }

    /**
     * Returns the setting by name.
     * @param name setting name
     * @param recursive if true searches setting in the whole stack and returns the closest one,
     * otherwise searches setting in the current section
     */
    public getCurrentSetting(name: string, recursive: boolean = true): Setting | undefined {
        let visitSectionCount = recursive ? this.stack.length : 1;
        for (let i = visitSectionCount; i > 0;) {
            let section = this.stack[--i];
            let value = section.getSetting(name);
            if (value !== void 0) {
                return value;
            }
        }

        return undefined;
    }

    public getSectionSettings(section?: string, recursive: boolean = true): Setting[] {
        let targetIdx = section ? this.stack.findIndex(s => s.name === section) : this.stack.length - 1;
        let result = [];
        if (targetIdx >= 0) {
            let start = recursive ? 0 : targetIdx;
            for (let i = start; i <= targetIdx; i++) {
                let target = this.stack[i];
                for (const setting of target.settings) {
                    result.push(setting);
                }
            }
        }
        return result;
    }

    public getSectionRange(section: string): TextRange | null {
        let node = this.stack.find(s => s.name === section);
        return node ? node.range : null;
    }

    private createErrorDiagnostic(section: TextRange, message: string): Diagnostic {
        return createDiagnostic(
            section.range,
            message,
            DiagnosticSeverity.Error,
        );
    }

    private checkDependenciesResolved(startIndex: number): Diagnostic | null {
        const stack: SectionStackNode[] = this.stack;

        for (let i = stack.length; i > startIndex;) {
            const section: SectionStackNode = stack[--i];
            if (!section.dependenciesResolved) {
                let unresolved = section.unresolved.map(s => `[${s}]`);
                let message: string;

                if (unresolved.length > 1) {
                    message = `Required sections ${unresolved.join(", ")} are not declared.`;
                } else {
                    message = `Required section ${unresolved.join(", ")} is not declared.`;
                }

                return this.createErrorDiagnostic(section.range, message);
            }
        }

        return null;
    }

    private checkAndGetDepth(sectionRange: TextRange): [number, Diagnostic | null] {
        const section = sectionRange.text;
        const expectedDepth: number = this.stack.length;

        let actualDepth: number = sectionDepthMap[section];
        let error: Diagnostic = null;

        if (actualDepth == null) {
            error = this.createErrorDiagnostic(sectionRange, `Unknown section [${section}].`);
        } else if (actualDepth > expectedDepth) {
            let canBeInherited = inheritableSections.has(section);
            if (canBeInherited && expectedDepth > 0) {
                actualDepth = expectedDepth;
            } else {
                let errorMessage = `Unexpected section [${section}]. `;
                let expectedSections: string[] = Object.entries(sectionDepthMap)
                    .filter(([, depth]) => depth === expectedDepth)
                    .map(([key, ]) => `[${key}]`);

                if (expectedSections.length > 1) {
                    errorMessage += `Expected one of ${expectedSections.join(", ")}.`;
                } else {
                    errorMessage += `Expected ${expectedSections[0]}.`;
                }
                error = this.createErrorDiagnostic(sectionRange, errorMessage);
            }
        }

        return [actualDepth, error];
    }
}
