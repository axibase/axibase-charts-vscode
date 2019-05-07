import { ConfigTree } from "./configTree";
import { getSetting } from "./util";

export const frequentlyUsed = ["mode", "type"];

type Section = any;

export interface SectionScope {
    widgetType?: string;
    mode?: string;
}

/**
 * Function to check that conditions are passed.
 */
export type Condition = (section: Section) => boolean | string;

function getValueOfCheckedSetting(settingName: string, section: Section): string | undefined {
    let value;
    if (frequentlyUsed.includes(settingName)) {
        value = section.getScopeValue(settingName);
    } else {
        let setting = ConfigTree.getSetting(section, settingName);
        if (setting === undefined) {
            /**
             * Setting is not declared, so loooking for default value.
             */
            setting = getSetting(settingName);
            if (setting !== undefined) {
                value = setting.defaultValue;
            }
        } else {
            value = setting.value;
        }
    }
    return value;
}

/**
 * Returns function which returns false if conditions are not satisfied.
 * Check is Requirement.requiredIfConditions should be checked.
 * @param settingName name of the setting
 * @param possibleValues values that can be assigned to the setting
 */
export function sectionMatchConditionRequired(settingName: string, possibleValues: string[]): Condition {
    return (section: Section) => {
        const value = getValueOfCheckedSetting(settingName, section);
        return value ? new RegExp(possibleValues.join("|")).test(value) : true;
    };
}

/**
 * Returns function which returns info message if conditions are not satisfied.
 * Checks is Requirement.dependent applicable.
 * @param settingName Name of the setting
 * @param possibleValues Values that can be assigned to the setting
 */
export function sectionMatchConditionUseless(settingName: string, possibleValues: string[]): Condition {
    return (section: Section) => {
        const value = getValueOfCheckedSetting(settingName, section);
        const currCondition = value ? new RegExp(possibleValues.join("|")).test(value.toString()) : true;
        if (!currCondition) {
            if (possibleValues.length > 1) {
                return `${settingName} is one of ${possibleValues.join(", ")}`;
            } else {
                return `${settingName} is ${possibleValues[0]}`;
            }
        }
        return null;
    };
}

/**
 * Helps to check related settings.
 */
export interface Requirement {
    // functions to check conditions
    conditions?: Condition[];
    // setting names, that are may depend on requiredIfConditions setting
    dependent: string | string[];
    // this setting will be required if the conditions are satisfied
    requiredIfConditions?: string;
    // at least one of these settings required if the conditions are satisfied
    requiredAnyIfConditions?: string[];
    // related setting
    relation?: string;
}
