define(["require", "exports", "../relatedSettingsRules"], function (require, exports, relatedSettingsRules_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ConfigTreeValidator {
        /**
         * Goes through validationRules and performs checks on corresponding sections.
         *
         * @param сonfigTree - Configuration tree
         * @returns Diagnosics about problems in sections
         */
        static validate(сonfigTree) {
            const walker = new ConfigTreeWalker(сonfigTree);
            const diagnostics = [];
            relatedSettingsRules_1.default.forEach((rulesForSection, sectionName) => {
                const sectionsToCheck = walker.getSectionsByName(sectionName);
                if (sectionsToCheck.length > 0) {
                    sectionsToCheck.forEach(section => {
                        rulesForSection.forEach(rule => {
                            const diag = rule.check(section);
                            if (diag) {
                                if (Array.isArray(diag)) {
                                    diagnostics.push(...diag);
                                }
                                else {
                                    diagnostics.push(diag);
                                }
                            }
                        });
                    });
                }
            });
            return diagnostics;
        }
    }
    exports.ConfigTreeValidator = ConfigTreeValidator;
    // tslint:disable-next-line:max-classes-per-file
    class ConfigTreeWalker {
        constructor(сonfigTree) {
            this.requestedSections = [];
            this.tree = сonfigTree;
        }
        /**
         * Triggers bypass of ConfigTree and returns array with specified sections.
         *
         * @param sectionName - Name of sections to be returned
         * @returns Array of sections with name `sectionName`
         */
        getSectionsByName(sectionName) {
            if (this.tree.getRoot) {
                this.walk(sectionName, this.tree.getRoot);
            }
            return this.requestedSections;
        }
        /**
         * Recursively bypasses the ConfigTree starting from `startsection` and
         * adds every section with name `targetSection` to the `requestedSections` array.
         *
         * @param targetSection - Name of sections to be added to `requestedSections` array
         * @param startSection - Section, from which the walk must begin
         */
        walk(targetSection, startSection) {
            for (let section of startSection.children) {
                if (section.name === targetSection) {
                    this.requestedSections.push(section);
                }
                else {
                    this.walk(targetSection, section);
                }
            }
        }
    }
});
