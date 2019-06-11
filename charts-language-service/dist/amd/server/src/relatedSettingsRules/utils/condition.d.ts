import { Section } from "../../configTree/section";
/**
 * Function to check that `section` matches conditions.
 */
export declare type Condition = (section: Section) => boolean | string;
/**
 * Returns function, which validates value of specified setting.
 *
 * @param settingName - Name of the setting
 * @param possibleValues  - Values that can be assigned to the setting
 * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
 */
export declare function requiredCondition(settingName: string, possibleValues: string[]): Condition;
/**
 * Returns function, which validates value of specified setting and generates string
 * with allowed values if check is not passed.
 *
 * @param settingName - Name of the setting
 * @param possibleValues - Values that can be assigned to the setting
 * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
 *          and generates info string if check is not passed
 */
export declare function isNotUselessIf(settingName: string, possibleValues: string[]): Condition;
