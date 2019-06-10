import { Diagnostic } from "vscode-languageserver-types";
import { Section } from "../../configTree/section";
import { noRequiredSetting, noRequiredSettings } from "../../messageUtil";
import { Setting } from "../../setting";
import { createDiagnostic } from "../../util";
import { requiredCondition } from "../utils/condition";
import { RelatedSettingsRule, Requirement } from "../utils/interfaces";

/**
 * If key (dependent) is declared in the section and the section matches all of conditions, then:
 *   a) setting, specified in `requiredSetting` is required for this section;
 *      or
 *   b) required at least one setting from `requiredSetting` array.
 * If `conditions` are null, suppose the section matches conditions.
 */
const checks: Map<string, Requirement> = new Map<string, Requirement>([
    [
        "colors", {
            /**
             * If "colors" is specified:
             *  1) check that:
             *      1) "type" is "calendar", "treemap " or "gauge";
             *      2) "mode" is "half" or "default";
             *  2) require "thresholds" (try to search in tree and create Diagnostic if neccessary).
             */
            conditions: [
                requiredCondition("type", ["calendar", "treemap", "gauge"]),
                requiredCondition("mode", ["half", "default"])
            ],
            requiredSetting: "thresholds"
        }],
    [
        "forecast-style", {
            conditions: [
                requiredCondition("type", ["chart"]),
                requiredCondition("mode", ["column", "column-stack"])
            ],
            requiredSetting: "data-type"
        }],
    [
        "forecast-horizon-start-time", {
            /**
             * If "forecast-horizon-start-time" is specified:
             *  1) check that "type" is "chart";
             *  2) require any of "forecast-horizon-end-time", "forecast-horizon-interval", "forecast-horizon-length".
             */
            conditions: [
                requiredCondition("type", ["chart"])
            ],
            requiredSetting: ["forecast-horizon-end-time", "forecast-horizon-interval", "forecast-horizon-length"]
        }],
    [
        "table", {
            /**
             * If "table" is specified, require "attribute".
             */
            requiredSetting: "attribute"
        }],
    [
        "attribute", {
            requiredSetting: "table"
        }],
    [
        "column-alert-style", {
            conditions: [
                requiredCondition("type", ["bar"])
            ],
            requiredSetting: "column-alert-expression"
        }],
    [
        "alert-style", {
            requiredSetting: "alert-expression"
        }],
    [
        "link-alert-style", {
            conditions: [
                requiredCondition("type", ["graph"])
            ],
            requiredSetting: "alert-expression"
        }],
    [
        "node-alert-style", {
            conditions: [
                requiredCondition("type", ["graph"])
            ],
            requiredSetting: "alert-expression"
        }],
    [
        "icon-alert-style", {
            conditions: [
                requiredCondition("type", ["pie", "text"])
            ],
            requiredSetting: "icon-alert-expression"
        }],
    [
        "icon-alert-expression", {
            conditions: [
                requiredCondition("type", ["pie"])
            ],
            requiredSetting: "icon"
        }],
    [
        "icon-color", {
            conditions: [
                requiredCondition("type", ["text"])
            ],
            requiredSetting: "icon"
        }],
    [
        "icon-position", {
            conditions: [
                requiredCondition("type", ["text"])
            ],
            requiredSetting: "icon"
        }],
    [
        "icon-size", {
            conditions: [
                requiredCondition("type", ["text"])
            ],
            requiredSetting: "icon"
        }],
    [
        "caption-style", {
            conditions: [
                requiredCondition("type", ["pie", "gauge"])
            ],
            requiredSetting: "caption"
        }]
]);

const rule: RelatedSettingsRule = {
    name: "Checks presence of required setting if dependent is specified",
    check(section: Section): Diagnostic[] | void {
        const diagnostics: Diagnostic[] = [];
        checks.forEach((requirement: Requirement, dependent: string) => {
            if (!section.matchesConditions(requirement.conditions)) {
                return;
            }
            const dependentSetting = section.getSettingFromTree(dependent);
            if (dependentSetting === undefined) {
                return;
            }
            const reqNames = requirement.requiredSetting;
            let required: Setting;
            let msg: string;
            if (Array.isArray(reqNames)) {
                for (const displayName of reqNames) {
                    required = section.getSettingFromTree(displayName);
                    if (required) {
                        break;
                    }
                }
                msg = noRequiredSettings(dependent, reqNames);
            } else {
                required = section.getSettingFromTree(reqNames);
                msg = noRequiredSetting(dependent, reqNames);
            }
            if (required === undefined) {
                diagnostics.push(createDiagnostic(section.range.range, msg));
            }
        });
        return diagnostics;
    }
};

export default rule;
