import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver";
import { uselessScope } from "./messageUtil";
import {
    Requirement,
    sectionMatchConditionRequired, sectionMatchConditionUseless,
} from "./requirement";
import { Section } from "./section";
import { Setting } from "./setting";
import { createDiagnostic, getSetting } from "./util";

/**
 * Related settings requirements
 *
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
const requiredSettings: Requirement[] = [
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

/**
 * Checks section for useless or missing required settings
 */
export class RequiredSettingsValidator {
    public diagnostics: Diagnostic[] = [];

    /**
     * @param requirement Requirement for `dependent` setting.
     * @param section Section, where `dependent` is declared.
     * @param dependent Setting, which requires other settings or which must be checked for applicability.
     */
    public checkCurrentAndSetRequirementsForChildren(requirement: Requirement, section: Section, dependent: Setting) {
        if (requirement.requiredIfConditions == null && requirement.requiredAnyIfConditions == null) {
            this.checkDependentUseless(section, requirement, dependent);
            return;
        }
        let requiredSetting;
        if (requirement.requiredIfConditions) {
            requiredSetting = getSetting(requirement.requiredIfConditions);
        } else {
            /**
             * If requirement.requiredIfConditions == null, then requiredAnyIfConditions != null.
             * It's supposed that all settings from `requiredAnyIfConditions` have the same sections,
             * that's why only first section is used here.
             */
            requiredSetting = getSetting(requirement.requiredAnyIfConditions[0]);
        }

        const sectionNames = requiredSetting.section;
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

    /**
     * Checks each children of the section recursevly.
     * @param targetSectionName name of the section, which need to be checked
     * @param requirements array of requirements for the section, which need to be checked
     * @param startSection root of subtree to search for targetSection
     */
    public checkAllChildren(targetSectionName: string, requirements: Requirement[], startSection: Section) {
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

    /**
     * Adds Diagnostic if section matches condifitons and doesn't contain required ("checked") setting.
     */
    private checkSection(requirements: Requirement[], section: Section) {
        for (const req of requirements) {
            if (section.sectionMatchConditions(req.conditions)) {
                if (req.requiredIfConditions) {
                    const required = req.requiredIfConditions;
                    const checkedSetting = section.getSettingFromTree(required);
                    const defaultValue = getSetting(required).defaultValue;
                    if (checkedSetting == null && defaultValue == null) {
                        this.diagnostics.push(createDiagnostic(section.range.range,
                            `${required} is required if ${req.dependent} is specified`));
                        return;
                    }
                } else {
                    const anyRequiredIsSpecified = req.requiredAnyIfConditions.some(
                        reqSetting => section.getSettingFromTree(reqSetting) != null);
                    if (!anyRequiredIsSpecified) {
                        this.diagnostics.push(createDiagnostic(section.range.range,
                            `${req.dependent} has effect only with one of the following:
 * ${req.requiredAnyIfConditions.join("\n * ")}`));
                    }
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
}

/**
 * Returns object from relatedSettings based on setting.displayName.
 * @param settingName setting.displayName
 */
export function getRequirement(settingName: string): Requirement | undefined {
    return requiredSettings.find(req => {
        return Array.isArray(req.dependent) ? req.dependent.includes(settingName) : req.dependent === settingName;
    });
}
