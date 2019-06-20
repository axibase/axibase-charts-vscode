import { Section } from "../../configTree/section";
import { getValueOfSetting } from "../../util";

/**
 * Function to check that `section` matches conditions.
 */
export type Condition = (section: Section) => boolean | string;

/**
 * Returns function, which validates value of specified setting.
 *
 * @param settingName - Name of the setting
 * @param possibleValues  - Values that can be assigned to the setting
 * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
 */
export function requiredCondition(settingName: string, possibleValues: string[]): Condition {
    return (section: Section) => {
        const value = getValueOfSetting(settingName, section);
        return value ? new RegExp(possibleValues.join("|")).test(value.toString()) : true;
    };
}

/**
 * Returns function, which validates value of specified setting and generates string
 * with allowed values if check is not passed.
 *
 * @param settingName - Name of the setting
 * @param possibleValues - Values that can be assigned to the setting
 * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
 *          and generates info string if check is not passed
 */
export function isNotUselessIf(settingName: string, possibleValues: string[]): Condition {
    return (section: Section) => {
        const value = getValueOfSetting(settingName, section);
        const valueIsOk = value ? new RegExp(possibleValues.join("|")).test(value.toString()) : true;
        if (!valueIsOk) {
            if (possibleValues.length > 1) {
                return `${settingName} is one of ${possibleValues.join(", ")}`;
            } else {
                return `${settingName} is ${possibleValues[0]}`;
            }
        }
        return null;
    };
}
