import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { incorrectColors, uselessScope } from "./messageUtil";
import {
    Condition, Requirement,
    sectionMatchConditionRequired, sectionMatchConditionUseless,
    SectionScope
} from "./requirement";
import { isNestedToPrevious, sectionDepthMap } from "./resources";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
import { createDiagnostic, getSetting } from "./util";

/**
 * If `requiredIfConditions` !== null OR `requiredAnyIfConditions` !== null,
 * the section will be checked for match to `conditions`; if section matches conditions, then:
 *  1) setting, specified in `requiredIfConditions` is required for this section;
 *  2) required at least one setting from `requiredAnyIfConditions`.
 * `requiredIfConditions` can not be specified simultaneously with `requiredAnyIfConditions`.
 *
 * If `requiredIfConditions` == null AND `requiredAnyIfConditions` == null,
 * the section will be checked for applicability of any of `dependent`;
 * if any setting from `dependent` is declared in the section, then section will be checked for match to `conditions`.
 */
const relatedSettings: Requirement[] = [
    {
        /**
         * If "type" is "calendar", "treemap " or "gauge" and mode is "half" or "default",
         * "colors" and "thresholds" are applicable, and if "colors" are specified, the "thresholds" are required.
         */
        conditions: [
            sectionMatchConditionRequired("type", ["calendar", "treemap", "gauge"]),
            sectionMatchConditionRequired("mode", ["half", "default"])
        ],
        dependent: "colors",
        requiredIfConditions: "thresholds"
    },
    {
        conditions: [
            sectionMatchConditionRequired("type", ["chart"]),
            sectionMatchConditionRequired("mode", ["column", "column-stack"])
        ],
        dependent: "forecast-style",
        requiredIfConditions: "data-type"
    },
    {
        conditions: [
            sectionMatchConditionRequired("type", ["chart"])
        ],
        dependent: "forecast-ssa-group-auto-count",
        requiredIfConditions: "forecast-ssa-decompose-eigentriple-limit"
    },
    {
        /**
         * If "type=chart" and "forecast-horizon-start-time" is specified,
         * any of "forecast-horizon-end-time", "forecast-horizon-interval",
         * "forecast-horizon-length" is required in [series].
         */
        conditions: [
            sectionMatchConditionRequired("type", ["chart"])
        ],
        dependent: "forecast-horizon-start-time",
        requiredAnyIfConditions: ["forecast-horizon-end-time", "forecast-horizon-interval", "forecast-horizon-length"]
    },
    {
        /**
         * If "end-time" is specified,
         * consider it is less than "forecast-horizon-end-time"
         */
        dependent: "end-time",
        relation: "forecast-horizon-end-time"
    },
    {
        /**
         * If "start-time" is specified,
         * consider it is less than "end-time"
         */
        dependent: "start-time",
        relation: "end-time"
    },
    {
        /**
         * If "type=chart" and "mode" is NOT "column-stack" or "column",
         * settings "negative-style" and "current-period-style" are useless.
         */
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("mode", ["column-stack", "column"])
        ],
        dependent: ["negative-style", "current-period-style"]
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("server-aggregate", ["false"])
        ],
        dependent: "moving-average"
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["calendar", "treemap", "gauge"]),
            sectionMatchConditionUseless("mode", ["half", "default"])
        ],
        dependent: ["ticks", "color-range", "gradient-count"]
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("forecast-arima-auto", ["false"])
        ],
        dependent: ["forecast-arima-auto-regression-interval", "forecast-arima-d", "forecast-arima-p"]
    },
    {
        conditions: [
            sectionMatchConditionUseless("type", ["chart"]),
            sectionMatchConditionUseless("forecast-hw-auto", ["false"])
        ],
        dependent: ["forecast-hw-alpha", "forecast-hw-beta", "forecast-hw-gamma"]
    },
    {
        dependent: "table", requiredIfConditions: "attribute"
    },
    {
        dependent: "attribute", requiredIfConditions: "table"
    },
    {
        dependent: "column-alert-style", requiredIfConditions: "column-alert-expression"
    },
    {
        dependent: "alert-style", requiredIfConditions: "alert-expression"
    },
    {
        dependent: "link-alert-style", requiredIfConditions: "alert-expression"
    },
    {
        dependent: "node-alert-style", requiredIfConditions: "alert-expression"
    },
    {
        dependent: "icon-alert-style", requiredIfConditions: "icon-alert-expression"
    },
    {
        dependent: "icon-alert-expression", requiredIfConditions: "icon"
    },
    {
        dependent: "icon-color", requiredIfConditions: "icon"
    },
    {
        dependent: "icon-position", requiredIfConditions: "icon"
    },
    {
        dependent: "icon-size", requiredIfConditions: "icon"
    },
    {
        dependent: "caption-style", requiredIfConditions: "caption"
    }
];

class Section {

    public name: string;
    public settings: Setting[];
    public parent: Section;
    public children: Section[] = [];
    public range: TextRange;
    /**
     * section name = requirements for this section
     */
    public requirementsForChildren: Map<string, Requirement[]> = new Map();
    public scope: SectionScope = {};

    public constructor(range: TextRange, settings: Setting[]) {
        this.range = range;
        this.name = range.text;
        this.settings = settings;
    }

    public applyScope() {
        if (this.parent !== undefined) {
            /**
             * We are not at [configuration].
             */
            this.scope = Object.create(this.parent.scope);
        }
        for (const setting of this.settings) {
            if (setting.name === "type") {
                this.scope.widgetType = setting.value;
            } else if (setting.name === "mode") {
                this.scope.mode = setting.value;
            }
        }
    }

    public getSetting(name: string): Setting | undefined {
        const cleared = Setting.clearSetting(name);
        return this.settings.find(s => s.name === cleared);
    }

    public getScopeValue(settingName: string): string {
        return settingName === "type" ? this.scope.widgetType : this.scope.mode;
    }
}

/**
 * Checks related settings.
 */
// tslint:disable-next-line:max-classes-per-file
export class ConfigTree {

    /**
     * Searches setting in the parents starting from the startSection and ending root, returns the closest one.
     * @param settingName Setting name
     * @param startSection Node of subtree to search for settingName
     */
    public static getSetting(startSection: Section, settingName: string): Setting | undefined {
        for (let currentSection = startSection; currentSection; currentSection = currentSection.parent) {
            const value = currentSection.getSetting(settingName);
            if (value !== void 0) {
                return value;
            }
        }
        return undefined;
    }

    public diagnostics: Diagnostic[];
    /**
     * Prevents from duplicates for incorrect colors if [widget] contains several [series], for example:
     *
     * thresholds = 0, 10, 20
     * colors = #d7ede2, #9ad1b6, #71bf99
     * [series]
     *   entity = nurswgvml006
     * [series]
     *   entity = nurswgvml007
     */
    private colorsDiagnostics: Map<Setting, Diagnostic> = new Map();
    private root: Section;
    private lastAddedParent: Section;
    private previous: Section;

    public constructor(diagnostics: Diagnostic[]) {
        this.diagnostics = diagnostics;
    }

    /**
     * Adds section to tree. Checks section for non-applicable settings and declares requirements for children.
     * Doesn't alert if the section is out of order, this check is performed by SectionStack.
     * @param range The text (name of section) and the position of the text
     * @param settings Section settings
     */
    public addSection(range: TextRange, settings: Setting[]) {
        const section = new Section(range, settings);
        const depth: number = sectionDepthMap[range.text];
        if (depth > 0 && !this.root) {
            return;
        }
        switch (depth) {
            case 0: { // [configuration]
                this.root = section;
                this.lastAddedParent = section;
                break;
            }
            case 1: { // [group]
                section.parent = this.root;
                this.lastAddedParent = section;
                break;
            }
            case 2: { // [widget]
                const group = this.root.children[this.root.children.length - 1];
                if (!group) {
                    return;
                }
                section.parent = group;
                this.lastAddedParent = section;
                break;
            }
            case 3: { // [series], [dropdown], [column], ...
                if (this.lastAddedParent && this.lastAddedParent.name === "column" && range.text === "series") {
                    section.parent = this.lastAddedParent;
                } else {
                    const group = this.root.children[this.root.children.length - 1];
                    if (!group) {
                        return;
                    }
                    const widget = group.children[group.children.length - 1];
                    if (!widget) {
                        return;
                    }
                    section.parent = widget;
                    this.lastAddedParent = section;
                }
                break;
            }
            case 4: { // [option], [properties], [tags]
                if (isNestedToPrevious(range.text, this.previous.name)) {
                    section.parent = this.previous;
                } else {
                    section.parent = this.lastAddedParent;
                }
                if (!section.parent) {
                    return;
                }
                break;
            }
        }
        if (section.parent) {
            // We are not in [configuration]
            section.parent.children.push(section);
        }
        this.previous = section;
        section.applyScope();

        for (const setting of settings) {
            const requirement = this.getRequirement(setting.displayName);
            if (requirement !== undefined) {
                /**
                 * Section contains dependent which can be useless or requires additional setting.
                 */
                this.checkCurrentAndSetRequirementsForChildren(requirement, section, setting);
            }
        }
    }

    /**
     * Bypasses the tree and adds diagnostics about not applicable settings
     * or absent required setting.
     */
    public goThroughTree() {
        if (!this.root) {
            return;
        }
        let currentLevel: Section[] = [this.root];
        while (currentLevel.length > 0) {
            let childAccumulator: Section[] = [];
            for (const parentSection of currentLevel) {
                for (let [sectionToCheck, reqsForSection] of parentSection.requirementsForChildren) {
                    this.checkAllChildren(sectionToCheck, reqsForSection, parentSection);
                }
                childAccumulator.push(...parentSection.children);
            }
            currentLevel = childAccumulator;
        }
        this.diagnostics.push(...this.colorsDiagnostics.values());
    }

    /**
     * Checks that start point isn't greater than end point
     * @param start interval start point
     * @param end interval end point
     */
    public checkTimeSettings(start?: Setting, end?: Setting): void {
        if (end === undefined || start === undefined) {
            return;
        }

        if (start.value >= end.value) {
            this.diagnostics.push(
                createDiagnostic(
                    end.textRange,
                    `${end.displayName} must be greater than ${start.displayName}`,
                    DiagnosticSeverity.Error
                )
            );
        }
    }

    /**
     * Returns object from relatedSettings based on setting.displayName.
     * @param settingName setting.displayName
     */
    private getRequirement(settingName: string): Requirement | undefined {
        return relatedSettings.find(req => {
            return Array.isArray(req.dependent) ? req.dependent.includes(settingName) : req.dependent === settingName;
        });
    }

    /**
     * Checks each children of the section recursevly.
     * @param targetSectionName name of the section, which need to be checked
     * @param requirements array of requirements for the section, which need to be checked
     * @param startSection root of subtree to search for targetSection
     */
    private checkAllChildren(targetSectionName: string, requirements: Requirement[], startSection: Section) {
        if (startSection.children.length < 1) {
            return;
        }
        for (const child of startSection.children) {
            if (child.name === targetSectionName) {
                this.checkSection(requirements, child);
                continue;
            }
            this.checkAllChildren(targetSectionName, requirements, child);
        }
    }

    private sectionMatchConditions(section: Section, conditions: Condition[]): boolean {
        if (conditions === undefined) {
            return true;
        }
        for (const condition of conditions) {
            const currCondition = condition(section);
            if (!currCondition) {
                return false;
            }
        }
        return true;
    }

    /**
     * Adds Diagnostic if section matches condifitons and doesn't contain required ("checked") setting.
     */
    private checkSection(requirements: Requirement[], section: Section) {
        for (const req of requirements) {
            if (this.sectionMatchConditions(section, req.conditions)) {
                if (req.requiredIfConditions) {
                    const required = req.requiredIfConditions;
                    const checkedSetting = ConfigTree.getSetting(section, required);
                    const defaultValue = getSetting(required).defaultValue;
                    if (checkedSetting == null && defaultValue == null) {
                        this.diagnostics.push(createDiagnostic(section.range.range,
                            `${required} is required if ${req.dependent} is specified`));
                        return;
                    }

                    switch (required) {
                        case "thresholds": {
                            const colorsSetting = ConfigTree.getSetting(section, "colors");
                            this.checkColorsMatchTreshold(colorsSetting, checkedSetting);
                            break;
                        }
                        case "forecast-ssa-decompose-eigentriple-limit": {
                            const groupAutoCount = ConfigTree.getSetting(section, "forecast-ssa-group-auto-count");
                            const eigentripleLimitValue = checkedSetting ? checkedSetting.value : defaultValue;
                            if (eigentripleLimitValue <= groupAutoCount.value) {
                                this.diagnostics.push(createDiagnostic(groupAutoCount.textRange,
                                    `forecast-ssa-group-auto-count ` +
                                    `must be less than forecast-ssa-decompose-eigentriple-limit (default 0)`));
                            }
                            break;
                        }
                    }
                } else if (req.requiredAnyIfConditions) {
                    const anyRequiredIsSpecified = req.requiredAnyIfConditions.some(
                        reqSetting => ConfigTree.getSetting(section, reqSetting) != null);
                    if (!anyRequiredIsSpecified) {
                        this.diagnostics.push(createDiagnostic(section.range.range,
                            `${req.dependent} has effect only with one of the following:
 * ${req.requiredAnyIfConditions.join("\n * ")}`));
                    }
                } else {
                    // Related settings time interval validation
                    let start: Setting;
                    let end: Setting;

                    switch (req.relation) {
                        case "forecast-horizon-end-time":
                        {
                            start = ConfigTree.getSetting(section, "end-time");
                            end = ConfigTree.getSetting(section, "forecast-horizon-end-time");
                            break;
                        }
                        case "end-time":
                        {
                            start = ConfigTree.getSetting(section, "start-time");
                            end = ConfigTree.getSetting(section, "end-time");
                            break;
                        }
                    }

                    this.checkTimeSettings(start, end);
                }
            }
        }
    }

    /**
     * If section doesn't match at least one condition, adds new Diagnostic about dependent.
     */
    private checkDependentUseless(section: Section, requirement: Requirement, dependent: Setting) {
        const msg: string[] = requirement.conditions.map(condition => condition(section) as string).filter(m => m);
        if (msg.length > 0) {
            this.diagnostics.push(createDiagnostic(
                dependent.textRange,
                uselessScope(dependent.displayName, `${msg.join(", ")}`),
                DiagnosticSeverity.Warning
            ));
        }
    }

    /**
     * Check the relationship between thresholds and colors:
     * in "gauge", "calendar", "treemap" number of colors (if specified) must be equal to number of thresholds minus 1.
     */
    private checkColorsMatchTreshold(colorsSetting: Setting, thresholdsSetting: Setting) {
        let colorsValues;
        let thresholdsValues;
        if (colorsSetting.values.length > 0) {
            colorsSetting.values.push(colorsSetting.value);
            colorsValues = colorsSetting.values;
        } else {
            /**
             * Converts 1) -> 2):
             * 1) colors = rgb(247,251,255), rgb(222,235,247), rgb(198,219,239)
             * 2) colors = rgb, rgb, rgb
             */
            colorsValues = colorsSetting.value.replace(/(\s*\d{3}\s*,?)/g, "");
            colorsValues = colorsValues.split(",").filter(s => s.trim() !== "");
        }
        if (thresholdsSetting.values.length > 0) {
            thresholdsSetting.values.push(thresholdsSetting.value);
            thresholdsValues = thresholdsSetting.values;
        } else {
            thresholdsValues = thresholdsSetting.value.split(",").filter(s => s.trim() !== "");
        }

        const expected = thresholdsValues.length - 1;
        if (colorsValues.length !== expected) {
            this.colorsDiagnostics.set(colorsSetting, createDiagnostic(colorsSetting.textRange,
                incorrectColors(`${colorsValues.length}`, `${expected}`)));
        }
    }

    /**
     * @param requirement Requirement for `dependent` setting.
     * @param section Section, where `dependent` is declared.
     * @param dependent Setting, which requires other settings or which must be checked for applicability.
     */
    private checkCurrentAndSetRequirementsForChildren(requirement: Requirement, section: Section, dependent: Setting) {

        if (
            requirement.requiredIfConditions == null
            && requirement.requiredAnyIfConditions == null
            && requirement.relation == null
        ) {
            this.checkDependentUseless(section, requirement, dependent);
            return;
        }
        let checkedSetting;
        if (requirement.requiredIfConditions) {
            checkedSetting = getSetting(requirement.requiredIfConditions);
        } else if (requirement.requiredAnyIfConditions) {
            /**
             * If requirement.requiredIfConditions == null, then requiredAnyIfConditions != null.
             * It's supposed that all settings from `requiredAnyIfConditions` have the same sections,
             * that's why only first section is used here.
             */
            checkedSetting = getSetting(requirement.requiredAnyIfConditions[0]);
        } else {
            checkedSetting = getSetting(requirement.relation);
        }

        const sectionNames = checkedSetting.section;
        if (!sectionNames) {
            return;
        }
        if (sectionNames.includes(section.name)) {
            // check current
            this.checkSection([requirement], section);
            return;
        }
        const childSectionNames: string[] = typeof sectionNames === "string" ? [sectionNames] : sectionNames;
        for (const secName of childSectionNames) {
            const reqs = section.requirementsForChildren.get(secName);
            if (reqs) {
                reqs.push(requirement);
            } else {
                section.requirementsForChildren.set(secName, [requirement]);
            }
        }
    }
}
