declare type MessageFactoryMethod = (found?: string, msg?: any) => string;
/**
 * Creates a error message for unknown setting or value.
 * @param found the variant found in the user's text
 * @returns message with or without a suggestion
 */
export declare const unknownToken: MessageFactoryMethod;
export declare const deprecatedTagSection: string;
export declare const settingsWithWhitespaces: MessageFactoryMethod;
export declare const tagNameWithWhitespaces: MessageFactoryMethod;
export declare const settingNameInTags: MessageFactoryMethod;
export declare const uselessScope: MessageFactoryMethod;
export declare const incorrectColors: MessageFactoryMethod;
export declare const illegalSetting: MessageFactoryMethod;
/**
 * If SCV pattern didn't match any known RegExp, compose error message
 * @param line line of code instruction
 * @returns csv error message
 */
export declare const getCsvErrorMessage: MessageFactoryMethod;
export declare const noRequiredSetting: MessageFactoryMethod;
export declare const noRequiredSettings: MessageFactoryMethod;
export declare const noMatching: MessageFactoryMethod;
export declare const lineFeedRequired: MessageFactoryMethod;
export {};
