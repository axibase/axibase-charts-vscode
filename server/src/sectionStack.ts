import { TextRange } from "./textRange";
import { sectionDepthMap, requiredSectionSettingsMap } from "./resources";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";

interface DependencyResolveInfo {
    resolvedCount: number;
    unresolved: string[];
}

class SectionStackNode {
    public readonly dependencies: DependencyResolveInfo[] = [];

    public constructor(public range: TextRange) {
        const deps = requiredSectionSettingsMap.get(this.name);
        if (deps && deps.sections) {
            for (const option of deps.sections) {
                this.dependencies.push({
                    resolvedCount: 0,
                    unresolved: option.slice(),
                });
            }
        }
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

// tslint:disable-next-line:max-classes-per-file
export class SectionStack {
    private stack: SectionStackNode[] = [];

    public insertSection(section: TextRange): Diagnostic | null {
        const sectionName: string = section.text;
        let depth: number = 0;
        try {
            depth = this.checkAndGetDepth(sectionName);
        } catch (err) {
            return this.createErrorDignostic(section, (err as Error).message);
        }

        let error: Diagnostic | null = null;
        if (depth < this.stack.length) {
            if (depth === 0) {
                // We are attempting to declare [configuration] twice
                return this.createErrorDignostic(section, `Unexpected section [${sectionName}].`);
            }

            // Pop stack, check dependencies of popped resolved
            error = this.checkDependenciesResolved(depth);
            this.stack.splice(depth, this.stack.length - depth);
        }

        for (const entry of this.stack) {
            entry.resolveDependency(sectionName);
        }

        this.stack.push(new SectionStackNode(section));

        return error;
    }

    public finalize(): Diagnostic {
        return this.checkDependenciesResolved(0);
    }

    private createErrorDignostic(section: TextRange, message: string): Diagnostic {
        return Diagnostic.create(
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

                return this.createErrorDignostic(section.range, message);
            }
        }

        return null;
    }

    private checkAndGetDepth(section: string): number {
        const expectedDepth: number = this.stack.length;
        const actualDepth: number = sectionDepthMap[section];

        if (actualDepth == null) {
            throw new Error(`Unknown section [${section}].`);
        } else if (actualDepth > expectedDepth) {
            let errorMessage = `Unexpected section [${section}]. `;
            let expectedSections: string[] = Object.entries(sectionDepthMap)
                .filter(([, depth]) => depth === expectedDepth)
                .map(([key, ]) => `[${key}]`);

            if (expectedSections.length > 1) {
                errorMessage += `Expected one of ${expectedSections.join(", ")}.`;
            } else {
                errorMessage += `Expected ${expectedSections[0]}.`;
            }
            throw new Error(errorMessage);
        }

        return actualDepth;
    }
}
