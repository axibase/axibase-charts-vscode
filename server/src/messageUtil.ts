import { INTERVAL_UNITS } from "./constants";
import { CSV_FROM_URL_MISSING_NAME_PATTERN } from "./regExpressions";

type MessageFactoryMethod = (found?: string, msg?: any) => string;
/**
 * Creates a error message for unknown setting or value.
 * @param found the variant found in the user's text
 * @returns message with or without a suggestion
 */
export const unknownToken: MessageFactoryMethod = (found: string): string => `${found} is unknown.`;
export const deprecatedTagSection: string = `Replace [tag] sections with [tags].
Enclose the tag name in double quotes in case it contains special characters.

[tag]
  name = k
  value = v
[tag]
  name = my column
  value = my value

[tags]
  k = v
  "my column" = my value
`;
export const settingsWithWhitespaces: MessageFactoryMethod = (found: string): string =>
  `The setting "${found}" contains whitespaces.\nReplace spaces with hyphens.`;

export const tagNameWithWhitespaces: MessageFactoryMethod = (found: string): string =>
  `The tag name ${found} contains whitespaces. Wrap it in double quotes.`;

export const settingNameInTags: MessageFactoryMethod = (found: string): string =>
  `${found} is interpreted as a series tag and is sent to the\nserver. ` +
  `Move the setting outside of the [tags] section or\n` +
  "enclose in double-quotes to send it to the server without\na warning.";

export const uselessScope: MessageFactoryMethod = (found: string, msg: string): string =>
  `${found} setting is applied only if ${msg}.`;

export const incorrectColors: MessageFactoryMethod = (found: string, msg: string): string =>
  `Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.
Current: ${found}, expected: ${msg}`;

export const illegalSetting: MessageFactoryMethod = (found: string): string =>
  `${found} setting is not allowed here.`;

/**
 * If SCV pattern didn't match any known RegExp, compose error message
 * @param line line of code instruction
 * @returns csv error message
 */
export const getCsvErrorMessage: MessageFactoryMethod = (line: string): string => {
  return (CSV_FROM_URL_MISSING_NAME_PATTERN.test(line)) ? `<name> in 'csv <name> from <url>' is missing` :
    `The line should contain a '=' or 'from' keyword`;
};

/**
 * If start-time, end-time and timespan are declared simultaneously, show the warning
 */
export const simultaneousTimeSettingsWarning: MessageFactoryMethod = (): string =>
`'start-time', 'end-time' and 'timespan' can not be declared simultaneously. 'timespan' will be ignored.`;

export const noRequiredSetting: MessageFactoryMethod = (dependent: string, required: string): string =>
  `${required} is required if ${dependent} is specified`;

export const noRequiredSettings: MessageFactoryMethod = (dependent: string, required: string[]): string =>
  `${dependent} has effect only with one of the following:
 * ${required.join("\n * ")}`;

export const noMatching: MessageFactoryMethod = (dependent: string, required: string): string =>
  `${dependent} has no matching ${required}`;

export const lineFeedRequired: MessageFactoryMethod = (dependent: string): string =>
  `A linefeed character after '${dependent}' keyword is required`;

export const supportedUnits: MessageFactoryMethod = (): string =>
  `Supported units:\n * ${INTERVAL_UNITS.join("\n * ")}`;

export const dateError: MessageFactoryMethod = (specificMsg: string, name: string): string =>
  `${specificMsg}. ${name} must be a date or calendar expression, for example:
 * current_hour + 1 minute
 * 2019-04-01T10:15:00Z`;
