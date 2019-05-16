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
  `${found} setting is appplied only if ${msg}.`;

export const incorrectColors: MessageFactoryMethod = (found: string, msg: string): string =>
  `Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.
Current: ${found}, expected: ${msg}`;

export const illegalSetting: MessageFactoryMethod = (found: string): string =>
  `${found} setting is not allowed here.`;

export const noRequiredSetting: MessageFactoryMethod = (dependent: string, required: string): string =>
  `${required} is required if ${dependent} is specified`;

export const noRequiredSettings: MessageFactoryMethod = (dependent: string, required: string[]): string =>
  `${dependent} has effect only with one of the following:
 * ${required.join("\n * ")}`;
