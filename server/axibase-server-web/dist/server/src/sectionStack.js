define(["require", "exports", "vscode-languageserver-types", "./resources", "./setting", "./textRange", "./util"], function (require, exports, vscode_languageserver_types_1, resources_1, setting_1, textRange_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SectionStackNode {
        constructor(range) {
            this.range = range;
            this.dependencies = [];
            this.settings = [];
            const deps = resources_1.requiredSectionSettingsMap.get(this.name);
            if (deps && deps.sections) {
                this.setRequiredSections(deps.sections);
            }
        }
        setRequiredSections(sections) {
            this.dependencies.splice(0, this.dependencies.length);
            for (const option of sections) {
                this.dependencies.push({
                    resolvedCount: 0,
                    unresolved: option.slice(),
                });
            }
        }
        insertSetting(setting) {
            this.settings.push(setting);
        }
        getSetting(name) {
            const cleared = setting_1.Setting.clearSetting(name);
            return this.settings.find(s => s.name === cleared);
        }
        /**
         * Remove section from dependency list for every dependency option
         * @param name name of incoming section
         */
        resolveDependency(name) {
            for (const option of this.dependencies) {
                const index = option.unresolved.indexOf(name);
                if (index >= 0) {
                    option.resolvedCount++;
                    option.unresolved.splice(index, 1);
                }
            }
        }
        /**
         * True if dependencies for any dependency option are resolved
         */
        get dependenciesResolved() {
            if (this.dependencies.length === 0) {
                return true;
            }
            return this.dependencies.some((deps) => deps.unresolved.length === 0);
        }
        /**
         * A name of underlying section
         */
        get name() {
            return this.range.text;
        }
        /**
         * A list of unresolved dependencies for section. If several options for
         * dependency list provisioned, return best of them. The best option is
         * an option with max number of resolved dependencies and min length of
         * unresolved.
         */
        get unresolved() {
            if (this.dependencies.length === 0) {
                return [];
            }
            const bestDependencyOption = this.dependencies
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
    const DummySectionStackNode = {
        dependencies: [],
        dependenciesResolved: true,
        name: "",
        range: new textRange_1.TextRange("", vscode_languageserver_types_1.Range.create(vscode_languageserver_types_1.Position.create(0, 0), vscode_languageserver_types_1.Position.create(0, 0))),
        settings: [],
        unresolved: [],
        resolveDependency() { },
        setRequiredSections() { },
        getSetting() { return undefined; },
        insertSetting() { },
        [Symbol.toStringTag]: "DummySectionStackNode",
    };
    // tslint:disable-next-line:max-classes-per-file
    class SectionStack {
        constructor() {
            this.stack = [];
        }
        insertSection(section) {
            const sectionName = section.text;
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
        getLastSection() {
            return this.stack[this.stack.length - 1];
        }
        finalize() {
            let err = this.checkDependenciesResolved(0);
            this.stack = [];
            return err;
        }
        requireSections(targetSection, ...sections) {
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
        setSectionRequirements(targetSection, sections) {
            let target = this.stack.find(s => s.name === targetSection);
            if (target) {
                target.setRequiredSections(sections);
            }
        }
        insertCurrentSetting(setting) {
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
        getCurrentSetting(name, recursive = true) {
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
        getSectionSettings(section, recursive = true) {
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
        getSectionRange(section) {
            let node = this.stack.find(s => s.name === section);
            return node ? node.range : null;
        }
        createErrorDiagnostic(section, message) {
            return util_1.createDiagnostic(section.range, message, vscode_languageserver_types_1.DiagnosticSeverity.Error);
        }
        checkDependenciesResolved(startIndex) {
            const stack = this.stack;
            for (let i = stack.length; i > startIndex;) {
                const section = stack[--i];
                if (!section.dependenciesResolved) {
                    let unresolved = section.unresolved.map(s => `[${s}]`);
                    let message;
                    if (unresolved.length > 1) {
                        message = `Required sections ${unresolved.join(", ")} are not declared.`;
                    }
                    else {
                        message = `Required section ${unresolved.join(", ")} is not declared.`;
                    }
                    return this.createErrorDiagnostic(section.range, message);
                }
            }
            return null;
        }
        checkAndGetDepth(sectionRange) {
            const section = sectionRange.text;
            const expectedDepth = this.stack.length;
            let actualDepth = resources_1.sectionDepthMap[section];
            let error = null;
            if (actualDepth == null) {
                error = this.createErrorDiagnostic(sectionRange, `Unknown section [${section}].`);
            }
            else if (actualDepth > expectedDepth) {
                let canBeInherited = resources_1.inheritableSections.has(section);
                if (canBeInherited && expectedDepth > 0) {
                    actualDepth = expectedDepth;
                }
                else {
                    let errorMessage = `Unexpected section [${section}]. `;
                    let expectedSections = Object.entries(resources_1.sectionDepthMap)
                        .filter(([, depth]) => depth === expectedDepth)
                        .map(([key,]) => `[${key}]`);
                    if (expectedSections.length > 1) {
                        errorMessage += `Expected one of ${expectedSections.join(", ")}.`;
                    }
                    else {
                        errorMessage += `Expected ${expectedSections[0]}.`;
                    }
                    error = this.createErrorDiagnostic(sectionRange, errorMessage);
                }
            }
            return [actualDepth, error];
        }
    }
    exports.SectionStack = SectionStack;
});
