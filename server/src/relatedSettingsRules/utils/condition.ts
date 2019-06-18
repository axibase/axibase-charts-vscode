import { Section } from "../../configTree/section";
import { ResourcesProvider } from "../../resourcesProvider";

/**
 * Function to check that `section` matches conditions.
 */
export type Condition = (section: Section) => boolean | string;

/**
 * Settings, that are frequently used in conditions checks,
 * see requiredSettings.ts and uselessSettings.ts.
 */
const frequentlyUsed = ["mode", "type"];

/**
 * Returns value of setting with specified displayName:
 *  a) if setting is frequently used, tries to get it from section's scope;
 *  b) otherwise searches setting in tree
 *  c) if there is no setting in tree, returns default value.
 *
 * @param settingName - Name of setting, which value is requisted
 * @param section - Start section, from which setting must be searched
 * @returns Value of Setting with name `settingName`.
 */
function getValueOfCheckedSetting(settingName: string, section: Section): string | number | boolean | undefined {
    let value;
    if (frequentlyUsed.includes(settingName)) {
        value = section.getScopeValue(settingName);
    } else {
        let setting = section.getSettingFromTree(settingName);
        if (setting === undefined) {
            /**
             * Setting is not declared, thus loooking for default value.
             */
            setting = new ResourcesProvider().getSetting(settingName);
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
 * Returns function, which validates value of specified setting.
 *
 * @param settingName - Name of the setting
 * @param possibleValues  - Values that can be assigned to the setting
 * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
 */
export function requiredCondition(settingName: string, possibleValues: string[]): Condition {
    return (section: Section) => {
        const value = getValueOfCheckedSetting(settingName, section);
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
        const value = getValueOfCheckedSetting(settingName, section);
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
