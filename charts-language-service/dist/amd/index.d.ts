/// <amd-module name="Field" />
declare module "Field" {
    /**
     * Represents a field in a script setting.
     * For example, `max` is a field in `alert-expression` setting
     */
    export class Field {
        /**
         * Args which are passed to the field if it is a script
         */
        readonly args: Field[];
        /**
         * Description of this field
         */
        readonly description: string;
        /**
         * Name of this field
         */
        readonly name: string;
        /**
         * Is this field required?
         * Useful on sub-levels, when describing fields of functions
         * which are passed to a setting.
         * For example, `alias` is required field in `avg()` function,
         * which is passed to `alert-expression`
         */
        readonly required: boolean;
        /**
         * Type of this field. For example, `sum` is function,
         * whereas `metric` is string in `alert-expression`
         */
        readonly type: string;
        constructor(type: string, name: string, description?: string, args?: Field[], required?: boolean);
    }
}
/// <amd-module name="PossibleValue" />
declare module "PossibleValue" {
    export class PossibleValue {
        readonly value: string;
        /**
         * Description of value
         */
        readonly detail: string;
        constructor(value: string, detail?: string);
    }
}
declare module "script" {
    import { Field } from "Field";
    export class Script {
        readonly fields: Field[];
        readonly returnValue: string | number | boolean;
        constructor(returnValue: string | number | boolean, fields?: Field[]);
    }
}
declare module "messageUtil" {
    type MessageFactoryMethod = (found?: string, msg?: any) => string;
    /**
     * Creates a error message for unknown setting or value.
     * @param found the variant found in the user's text
     * @returns message with or without a suggestion
     */
    export const unknownToken: MessageFactoryMethod;
    export const deprecatedTagSection: string;
    export const settingsWithWhitespaces: MessageFactoryMethod;
    export const tagNameWithWhitespaces: MessageFactoryMethod;
    export const settingNameInTags: MessageFactoryMethod;
    export const uselessScope: MessageFactoryMethod;
    export const incorrectColors: MessageFactoryMethod;
    export const illegalSetting: MessageFactoryMethod;
    /**
     * If SCV pattern didn't match any known RegExp, compose error message
     * @param line line of code instruction
     * @returns csv error message
     */
    export const getCsvErrorMessage: MessageFactoryMethod;
    export const noRequiredSetting: MessageFactoryMethod;
    export const noRequiredSettings: MessageFactoryMethod;
    export const noMatching: MessageFactoryMethod;
    export const lineFeedRequired: MessageFactoryMethod;
}
declare module "util" {
    import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver-types";
    import { Setting } from "setting";
    /**
     * @param value the value to find
     * @param map the map to search
     * @returns true if at least one value in map is/contains the wanted value
     */
    export function isInMap<T>(value: T, map: Map<string, T[]> | Map<string, T[][]>): boolean;
    /**
     * @param target array of aliases
     * @param array array to perform the search
     * @returns true, if array contains a value from target
     */
    export function isAnyInArray<T>(target: T[], array: T[]): boolean;
    /**
     * Clears the passed argument and looks for a setting with the same name
     * @param name name of the wanted setting
     * @param range TextRange of the setting in text.
     * @returns the wanted setting or undefined if not found
     */
    export function getSetting(name: string, range?: Range): Setting | undefined;
    /**
     * Counts CSV columns using RegExp.
     * @param line a CSV-formatted line
     * @returns number of CSV columns in the line
     */
    export function countCsvColumns(line: string): number;
    /**
     * Short-hand to create a diagnostic with undefined code and a standardized source
     * @param range Where is the mistake?
     * @param severity How severe is that problem?
     * @param message What message should be passed to the user?
     */
    export function createDiagnostic(range: Range, message: string, severity?: DiagnosticSeverity): Diagnostic;
    /**
     * Replaces all comments with spaces.
     * We need to remember places of statements in the original configuration,
     * that's why it is not possible to delete all comments, whereas they must be ignored.
     * @param text the text to replace comments
     * @returns the modified text
     */
    export function deleteComments(text: string): string;
    /**
     * Replaces scripts body with newline character
     * @param text the text to perform modifications
     * @returns the modified text
     */
    export function deleteScripts(text: string): string;
    /**
     * @returns true if the current line contains white spaces or nothing, false otherwise
     */
    export function isEmpty(str: string): boolean;
    /**
     * Creates a diagnostic for a repeated setting. Warning if this setting was
     * multi-line previously, but now it is deprecated, error otherwise.
     * @param range The range where the diagnostic will be displayed
     * @param declaredAbove The setting, which has been declared earlier
     * @param current The current setting
     */
    export function repetitionDiagnostic(range: Range, declaredAbove: Setting, current: Setting): Diagnostic;
    /**
     * Creates Range object.
     *
     * @param start - The starting position in the string
     * @param length - Length of the word to be highlighted
     * @param lineNumber - Number of line, where is the word to be highlighted
     * @returns Range object with start equal to `start` and end equal to `start+length` and line equal to `lineNumber`
     */
    export function createRange(start: number, length: number, lineNumber: number): Range;
}
declare module "setting" {
    import { Diagnostic, Range } from "vscode-languageserver-types";
    import { DefaultSetting } from "defaultSetting";
    export const intervalUnits: string[];
    export const calendarKeywords: string[];
    /**
     * In addition to DefaultSetting contains specific fields.
     */
    export class Setting extends DefaultSetting {
        textRange: Range;
        /**
         * Setting value.
         */
        value: string;
        /**
         * Setting values for multiline settings (mostly for colors and thresholds).
         */
        values: string[];
        /**
         * Line number and characters placement of the setting.
         */
        private _textRange;
        constructor(setting: DefaultSetting);
        /**
         * Checks the type of the setting and creates a corresponding diagnostic
         * @param range where the error should be displayed
         */
        checkType(range: Range): Diagnostic | undefined;
        private checkNumber;
        private checkPercentile;
        private findIndexInEnum;
    }
}
declare module "defaultSetting" {
    import { PossibleValue } from "PossibleValue";
    import { Script } from "script";
    export interface SettingScope {
        widget: string;
        section: string;
    }
    interface ValueRange {
        value: number;
        excluded: boolean;
    }
    /**
     * Holds the description of a setting and corresponding methods.
     */
    export class DefaultSetting {
        /**
         * Lowercases the string and deletes non-alphabetic characters
         * @param str string to be cleared
         * @returns cleared string
         */
        static clearSetting: (str: string) => string;
        /**
         * Lowercases the value of setting
         * @param str string to be cleared
         * @returns cleared string
         */
        static clearValue: (str: string) => string;
        readonly defaultValue?: string | number | boolean;
        /**
         * A brief description for the setting
         */
        readonly description: string;
        /**
         * User-friendly setting name like 'refresh-interval'
         */
        readonly displayName: string;
        /**
         * Array containing all possible values. RegExp is supported
         */
        readonly enum: string[];
        /**
         * Example value for the setting. Should not equal to the default value
         */
        readonly example: string | number | boolean;
        /**
         * The settings in this array must not be declared simultaneously with the current
         */
        readonly excludes: string[];
        /**
         * The maximum allowed value for the setting
         */
        maxValue: number | ValueRange;
        /**
         * The minimum allowed value for the setting
         */
        minValue: number | ValueRange;
        /**
         * Is the setting allowed to be repeated
         */
        readonly multiLine: boolean;
        /**
         * Inner setting name. Lower-cased, without any symbols except alphabetical.
         * For example, "refreshinterval"
         */
        readonly name: string;
        /**
         * Warning text to show if setting is deprecated
         */
        readonly deprecated?: string;
        /**
         * Holds the description of the setting if it is a script
         */
        readonly script?: Script;
        /**
         * The section, where the setting is applicable.
         * For example, "widget" or "series".
         */
        readonly section?: string | string[];
        /**
         * The type of the setting.
         * Possible values: string, number, integer, boolean, enum, interval, date
         */
        readonly type: string;
        /**
         * Type of the widget were setting is applicable, for example,
         * gradient-count is applicable for gauge, treemap and calendar.
         */
        readonly widget: string[] | string;
        /**
         * String values that can assigned to the setting.
         * Do not prevent use other values, in comparison with enum.
         */
        readonly possibleValues?: PossibleValue[];
        readonly override?: {
            [scope: string]: Partial<DefaultSetting>;
        };
        private overrideCache;
        constructor(setting?: DefaultSetting);
        /**
         * Create an instance of setting with matching overrides applied.
         * If no override can be applied returns this instanse.
         * @param scope Configuration scope where setting exist
         */
        applyScope(scope: SettingScope): DefaultSetting;
        /**
         * Generates a string containing fully available information about the setting
         */
        toString(): string;
        private getOverrideTest;
    }
}
declare module "resources" {
    import { DefaultSetting } from "defaultSetting";
    export const settingsMap: Map<string, DefaultSetting>;
    interface SectionRequirements {
        settings?: DefaultSetting[][];
        sections?: string[][];
    }
    /**
     * Map of required settings for each section and their "aliases".
     * For instance, `series` requires `entity`, but `entities` is also allowed.
     * Additionally, `series` requires `metric`, but `table` with `attribute` is also ok
     */
    export const requiredSectionSettingsMap: Map<string, SectionRequirements>;
    export const widgetRequirementsByType: Map<string, SectionRequirements>;
    /**
     * Key is section name, value is array of parent sections for the key section
     */
    export const parentSections: Map<string, string[]>;
    /**
     * @returns true if the current section is nested in the previous section
     */
    export function isNestedToPrevious(currentName: string, previousName: string): boolean;
    /**
     * @returns array of parent sections for the section
     */
    export function getParents(section: string): string[];
    export const sectionDepthMap: {
        [section: string]: number;
    };
    /**
     * Contains names of sections which can appear at depth `1..max_depth`, where
     * `max_depth` is a value from `sectionDepthMap`
     */
    export const inheritableSections: Set<string>;
}
declare module "completionProvider" {
    import { CompletionItem, CompletionItemKind, InsertTextFormat, Position, TextDocument } from "vscode-languageserver-types";
    export const snippets: any;
    export interface ItemFields {
        insertTextFormat?: InsertTextFormat;
        kind?: CompletionItemKind;
        insertText: string;
        detail?: string;
        name?: string;
    }
    /**
     * Provides dynamic completion items.
     */
    export class CompletionProvider {
        private readonly text;
        private readonly currentLine;
        constructor(textDocument: TextDocument, position: Position);
        /**
         * Creates completion items
         */
        getCompletionItems(): CompletionItem[];
        /**
         * Creates a completion item containing `for` loop.
         * `in` statement is generated based on previously declared lists and vars if any.
         * Variable name is generated based on `in` statement.
         * @returns completion item
         */
        private completeFor;
        /**
         * Creates an array of completion items containing `if` statement.
         * Conditions are generated based on previously declared `for` loops.
         * @returns array containing variants of `if` statement
         */
        private completeIf;
        /**
         * Creates an array of completion items containing setting names.
         * @returns array containing snippets
         */
        private completeSettingName;
        /**
         * Creates an array of completion items containing possible values for settings.
         * @param settingName name of the setting, for example "colors"
         * @returns array containing completions
         */
        private completeSettingValue;
        /**
         * Creates an array of completion items containing snippets.
         * @returns array containing snippets
         */
        private completeSnippets;
        /**
         * Creates an array of completion items containing possible values for settings with type = "string".
         * @param setting the setting
         * @returns array containing completions
         */
        private completeStringSettingValue;
        /**
         * Set fields for CompletionItem
         * @param insertText text to be inserted with completion request
         * @returns completion
         */
        private fillCompletionItem;
        /**
         * Сonverts the source array to array of completions
         * @param processedArray the source array
         * @param additionalStrings the strings to be processed and added to completions
         * @returns completions
         */
        private getItemsArray;
    }
}
declare module "config" {
    /**
     * Stores config lines as array, removes comments.
     */
    export class Config {
        currentLineNumber: number;
        private currentLine;
        private lines;
        constructor(text: string);
        getCurrentLine(): string;
        /**
         * Returns lowercased config line with specified index.
         *
         * @param line - Index of line to be returned
         * @returns Lowercased line of config with index equal to `line`
         */
        getLine(line: number): string | null;
        [Symbol.iterator](): IterableIterator<string>;
    }
}
/// <amd-module name="CheckPriority" />
declare module "CheckPriority" {
    /**
     * Used in JavaScriptChecksQueue to ensure that the udf is placed earlier than it's first call
     */
    export const enum CheckPriority {
        High = 0,
        Low = 1
    }
}
declare module "textRange" {
    import { Range } from "vscode-languageserver-types";
    /**
     * Contains the text and the position of the text
     */
    export class TextRange {
        /**
         * Matches a keyword
         */
        static readonly KEYWORD_REGEXP: RegExp;
        /**
         * Checks is current keyword closeable or not (can be closed like var-endvar)
         * @param line the line containing the keyword
         * @returns true if the keyword closeable
         */
        static isCloseAble(line: string): boolean;
        /**
         * Checks does the keyword close a section or not
         * @param line the line containing the keyword
         * @returns true if the keyword closes a section
         */
        static isClosing(line: string): boolean;
        /**
         * Parses a keyword from the line and creates a TextRange.
         * @param line the line containing the keyword
         * @param i the index of the line
         * @param canBeUnclosed whether keyword can exist in both closed and unclosed variant or not
         */
        static parse(line: string, i: number, canBeUnclosed: boolean): TextRange | undefined;
        /**
         * Priority of the text, used in jsDomCaller: settings with higher priority are placed earlier in test js "file"
         */
        priority: number;
        /**
         * priority property setter
         */
        textPriority: number;
        /**
         * Position of the text
         */
        readonly range: Range;
        /**
         * Text at this position
         */
        readonly text: string;
        /**
         * Keyword can exist in both closed and unclosed variants
         */
        readonly canBeUnclosed: boolean;
        constructor(text: string, range: Range, canBeUnclosed?: boolean);
    }
}
declare module "relatedSettingsRules/utils/condition" {
    import { Section } from "configTree/section";
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
    export function requiredCondition(settingName: string, possibleValues: string[]): Condition;
    /**
     * Returns function, which validates value of specified setting and generates string
     * with allowed values if check is not passed.
     *
     * @param settingName - Name of the setting
     * @param possibleValues - Values that can be assigned to the setting
     * @returns The function, which checks that value of setting with name `settingName` is any of `possibleValues`
     *          and generates info string if check is not passed
     */
    export function isNotUselessIf(settingName: string, possibleValues: string[]): Condition;
}
declare module "configTree/section" {
    import { Condition } from "relatedSettingsRules/utils/condition";
    import { Setting } from "setting";
    import { TextRange } from "textRange";
    /**
     * See frequentlyUsed.
     */
    export interface SectionScope {
        widgetType?: string;
        mode?: string;
    }
    /**
     * ConfigTree node.
     */
    export class Section {
        name: string;
        settings: Setting[];
        parent: Section;
        children: Section[];
        range: TextRange;
        scope: SectionScope;
        /**
         * @param range - The text (name of section) and the position of the text
         * @param settings - Section settings
         */
        constructor(range: TextRange, settings: Setting[]);
        applyScope(): void;
        /**
         * Returns setting from this section by it's displayName.
         *
         * @param name - Setting.displayName
         * @returns Setting with displayname equal to `settingName`
         */
        getSetting(name: string): Setting | undefined;
        /**
         * Searches setting in the tree by it's displayName,
         * starting from the current section and ending root, returns the closest one.
         *
         * @param settingName - Setting.displayName
         * @returns Setting with displayname equal to `settingName`
         */
        getSettingFromTree(settingName: string): Setting | undefined;
        getScopeValue(settingName: string): string;
        /**
         * Returns true if section passes all of conditions, otherwise returns false.
         *
         * @param conditions - Array of conditions, for which section must be checked
         * @returns Result of `conditions` checks.
         */
        matchesConditions(conditions: Condition[]): boolean;
    }
}
declare module "configTree/configTree" {
    import { Setting } from "setting";
    import { TextRange } from "textRange";
    import { Section } from "configTree/section";
    /**
     * Stores sections with corresponding settings in tree order.
     */
    export class ConfigTree {
        private root;
        private lastAddedParent;
        private previous;
        readonly getRoot: Section;
        /**
         * Creates Section object based on `range` and `settings`, applies scope to it and adds to tree.
         * Doesn't alert if the section is out of order, this check is performed by SectionStack.
         *
         * @param range - The text (name of section) and the position of the text
         * @param settings - Section settings
         */
        addSection(range: TextRange, settings: Setting[]): void;
    }
}
declare module "relatedSettingsRules/utils/interfaces" {
    import { Diagnostic } from "vscode-languageserver-types";
    import { Section } from "configTree/section";
    import { Condition } from "relatedSettingsRules/utils/condition";
    /**
     * Function, which performs check of the section.
     */
    export type Check = (section: Section) => Diagnostic | Diagnostic[] | void;
    export interface RelatedSettingsRule {
        name?: string;
        check: Check;
    }
    export interface Requirement {
        conditions?: Condition[];
        requiredSetting: string | string[];
    }
}
declare module "relatedSettingsRules/presenceValidation/noUselessSettings/forSeries" {
    import { Condition } from "relatedSettingsRules/utils/condition";
    /**
     * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
     */
    const checks: Map<string, Condition[]>;
    export default checks;
}
declare module "relatedSettingsRules/presenceValidation/noUselessSettings/forWidget" {
    import { Condition } from "relatedSettingsRules/utils/condition";
    /**
     * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
     */
    const checks: Map<string, Condition[]>;
    export default checks;
}
declare module "relatedSettingsRules/presenceValidation/noUselessSettings/index" {
    import { RelatedSettingsRule } from "relatedSettingsRules/utils/interfaces";
    export const noUselessSettingsForWidget: RelatedSettingsRule;
    export const noUselessSettingsForSeries: RelatedSettingsRule;
}
declare module "relatedSettingsRules/presenceValidation/requiredSettings" {
    import { RelatedSettingsRule } from "relatedSettingsRules/utils/interfaces";
    const rule: RelatedSettingsRule;
    export default rule;
}
declare module "relatedSettingsRules/valueValidation/colorsThresholds" {
    import { RelatedSettingsRule } from "relatedSettingsRules/utils/interfaces";
    const rule: RelatedSettingsRule;
    export default rule;
}
declare module "relatedSettingsRules/valueValidation/forecastAutoCountAndEigentripleLimit" {
    import { RelatedSettingsRule } from "relatedSettingsRules/utils/interfaces";
    const rule: RelatedSettingsRule;
    export default rule;
}
declare module "relatedSettingsRules/valueValidation/forecastEndTime" {
    import { RelatedSettingsRule } from "relatedSettingsRules/utils/interfaces";
    const rule: RelatedSettingsRule;
    export default rule;
}
declare module "relatedSettingsRules/valueValidation/startEndTime" {
    import { RelatedSettingsRule } from "relatedSettingsRules/utils/interfaces";
    const rule: RelatedSettingsRule;
    export default rule;
}
declare module "relatedSettingsRules/index" {
    import { RelatedSettingsRule } from "relatedSettingsRules/utils/interfaces";
    const rulesBySection: Map<string, RelatedSettingsRule[]>;
    export default rulesBySection;
}
declare module "configTree/configTreeValidator" {
    import { Diagnostic } from "vscode-languageserver-types";
    import { ConfigTree } from "configTree/configTree";
    export class ConfigTreeValidator {
        /**
         * Goes through validationRules and performs checks on corresponding sections.
         *
         * @param сonfigTree - Configuration tree
         * @returns Diagnosics about problems in sections
         */
        static validate(сonfigTree: ConfigTree): Diagnostic[];
    }
}
declare module "keywordHandler" {
    import { Diagnostic } from "vscode-languageserver-types";
    import { TextRange } from "textRange";
    export const BLOCK_SQL_START: RegExp;
    export const BLOCK_SQL_END: RegExp;
    export const BLOCK_SCRIPT_START: RegExp;
    export const BLOCK_SCRIPT_END: RegExp;
    export class KeywordHandler {
        diagnostics: Diagnostic[];
        keywordsStack: TextRange[];
        constructor(keywordsStack: TextRange[]);
        handleSql(line: string, foundKeyword: TextRange): void;
        handleScript(line: string, foundKeyword: TextRange): void;
    }
}
declare module "sectionStack" {
    import { Diagnostic } from "vscode-languageserver-types";
    import { Setting } from "setting";
    import { TextRange } from "textRange";
    interface DependencyResolveInfo {
        resolvedCount: number;
        unresolved: string[];
    }
    type AtLeastOneString = [string, ...string[]];
    class SectionStackNode {
        range: TextRange;
        readonly dependencies: DependencyResolveInfo[];
        readonly settings: Setting[];
        constructor(range: TextRange);
        setRequiredSections(sections: string[][]): void;
        insertSetting(setting: Setting): void;
        getSetting(name: string): Setting | undefined;
        /**
         * Remove section from dependency list for every dependency option
         * @param name name of incoming section
         */
        resolveDependency(name: string): void;
        /**
         * True if dependencies for any dependency option are resolved
         */
        readonly dependenciesResolved: boolean;
        /**
         * A name of underlying section
         */
        readonly name: string;
        /**
         * A list of unresolved dependencies for section. If several options for
         * dependency list provisioned, return best of them. The best option is
         * an option with max number of resolved dependencies and min length of
         * unresolved.
         */
        readonly unresolved: string[];
    }
    export class SectionStack {
        private stack;
        insertSection(section: TextRange): Diagnostic | null;
        getLastSection(): SectionStackNode;
        finalize(): Diagnostic;
        requireSections(targetSection: string, ...sections: AtLeastOneString): void;
        setSectionRequirements(targetSection: string, sections: string[][]): void;
        insertCurrentSetting(setting: Setting): void;
        /**
         * Returns the setting by name.
         * @param name setting name
         * @param recursive if true searches setting in the whole stack and returns the closest one,
         * otherwise searches setting in the current section
         */
        getCurrentSetting(name: string, recursive?: boolean): Setting | undefined;
        getSectionSettings(section?: string, recursive?: boolean): Setting[];
        getSectionRange(section: string): TextRange | null;
        private createErrorDiagnostic;
        private checkDependenciesResolved;
        private checkAndGetDepth;
    }
}
declare module "validator" {
    import { Diagnostic } from "vscode-languageserver-types";
    /**
     * Performs validation of a whole document line by line.
     */
    export class Validator {
        /**
         * Array of declared aliases in the current widget
         */
        private readonly aliases;
        /**
         * Number of CSV columns in the current CSV header
         */
        private csvColumns?;
        /**
         * TextRange containing name and position of the current section declaration
         */
        private currentSection?;
        /**
         * Contains sections hierarchy from configuration
         */
        private readonly sectionStack;
        /**
         * Array of settings declared in current section
         */
        private currentSettings;
        /**
         * Array of de-aliases (value('alias')) in the current widget
         */
        private readonly deAliases;
        /**
         * The last found keyword (script, csv, var, for...) and the position
         */
        private foundKeyword?;
        /**
         * Map of settings declared in if statement.
         * Key is line number and keyword. For example, "70if server == 'vps'", "29else".
         * Index is used to distinguish statements from each other
         */
        private readonly ifSettings;
        /**
         * Stack of nested keywords. For example, if can be included to a for.
         */
        private readonly keywordsStack;
        /**
         * Last if statement. Used to get/set settings in ifSettigns
         */
        private lastCondition?;
        /**
         * Result of last regexp execution
         */
        private match?;
        /**
         * Map of settings declared in parent sections. Keys are section names.
         */
        private readonly parentSettings;
        /**
         * Position of declaration of previous section and the name of the section
         */
        private previousSection?;
        /**
         * Settings declared in the previous section
         */
        private previousSettings;
        /**
         * Settings required to declare in the current section
         */
        private requiredSettings;
        /**
         * Validation result
         */
        private readonly result;
        /**
         * Map of settings in the current widget and their values
         */
        private readonly settingValues;
        /**
         * Map of defined variables, where key is type (for, var, csv...)
         */
        private readonly variables;
        /**
         * Type of the current widget
         */
        private currentWidget?;
        /**
         * Line number of last "endif" keyword
         */
        private lastEndIf;
        /**
         * Stores sections with corresponding settings in tree order.
         */
        private configTree;
        private config;
        private keywordHandler;
        constructor(text: string);
        /**
         * Iterates over the document content line by line
         * @returns diagnostics for all found mistakes
         */
        lineByLine(): Diagnostic[];
        /**
         * Checks whether has the keyword ended or not
         * @param keyword keyword which is expected to end
         */
        private isNotKeywordEnd;
        /**
         * Adds all current section setting to parent
         * if they're required by a section
         */
        private addCurrentToParentSettings;
        /**
         * Adds new entry to settingValue map and new Setting to SectionStack
         * based on this.match, also sets value for setting.
         * @param setting setting to which value will be set
         */
        private addSettingValue;
        /**
         * Adds a setting based on this.match to array
         * or creates a new diagnostic if setting is already present
         * @param array the target array
         * @returns the array containing the setting from this.match
         */
        private addToSettingArray;
        /**
         * Adds a setting based on this.match to the target map
         * or creates a new diagnostic if setting is already present
         * @param key the key, which value will contain the setting
         * @param setting which setting to add
         * @returns the map regardless was it modified or not
         */
        private addToParentsSettings;
        /**
         * Adds a string based on this.match to the array
         * or creates a diagnostic if the string is already present
         * @param array  the target array
         * @returns the array regardless was it modified or not
         */
        private addToStringArray;
        /**
         * Adds a string based on this.match to a value of the provided key
         * @param map the target map
         * @param key the key which value will contain the setting
         * @returns the map regardless was it modified or not
         */
        private addToStringMap;
        /**
         * Tests if keywordsStack contain the provided name or not
         * @param name the target keyword name
         * @return true, if stack contains the keyword, false otherwise
         */
        private areWeIn;
        /**
         * Checks that each de-alias has corresponding alias
         */
        private checkAliases;
        /**
         * Tests that user has finished a corresponding keyword
         * For instance, user can write "endfor" instead of "endif"
         * @param expectedEnd What the user has finished?
         */
        private checkEnd;
        /**
         * Check that the section does not contain settings
         * Which are excluded by the specified one
         * @param setting the specified setting
         */
        private checkExcludes;
        private checkFreemarker;
        /**
         * Creates diagnostics if the current section does not contain required settings.
         */
        private checkRequredSettingsForSection;
        /**
         * Creates a new diagnostic if the provided setting is defined
         * @param setting the setting to perform check
         */
        private checkRepetition;
        /**
         * Creates diagnostics for all unclosed keywords
         */
        private diagnosticForLeftKeywords;
        /**
         * Handles every line in the document, calls corresponding functions
         */
        private eachLine;
        /**
         * Adds all de-aliases from the line to the corresponding array
         */
        private findDeAliases;
        /**
         * Returns the keyword from the top of keywords stack without removing it
         * @returns the keyword which is on the top of keywords stack
         */
        private getLastKeyword;
        /**
         * Creates a diagnostic about unknown setting name or returns the setting
         * @returns undefined if setting is unknown, setting otherwise
         */
        private getSettingCheck;
        /**
         * Calculates the number of columns in the found csv header
         */
        private handleCsv;
        /**
         * Creates a diagnostic if `else` is found, but `if` is not
         * or `if` is not the last keyword
         */
        private handleElse;
        /**
         * Removes the variable from the last `for`
         */
        private handleEndFor;
        /**
         * Creates diagnostics related to `for ... in _here_` statements
         * Like "for srv in servers", but "servers" is not defined
         * Also adds the new `for` variable to the corresponding map
         */
        private handleFor;
        /**
         * Adds new variable to corresponding map,
         * Pushes a new keyword to the keyword stack
         * If necessary (`list hello = value1, value2` should not be closed)
         */
        private handleList;
        /**
         * Performs required operations after a section has finished.
         * Mostly empties arrays.
         */
        private handleSection;
        /**
         * Attempts to add section to section stack, displays error if section
         * is out ouf hierarchy, unknown or has unresolved section dependencies
         * If section is null, finalizes section stack and return summary error
         * Adds last section of stack to ConfigTree.
         * @param section section to add or null
         */
        private setSectionToStackAndTree;
        /**
         * Calls functions in proper order to handle a found setting
         */
        private handleSettings;
        /**
         * Checks whether the setting is defined and is allowed to be defined in the current widget
         * @param setting the setting to be checked
         */
        private isAllowedWidget;
        /**
         * Return true if the setting is allowed to be defined in the current section.
         * @param setting The setting to be checked.
         */
        private isAllowedInSection;
        /**
         * Processes a regular setting which is defined not in tags/keys section
         */
        private handleRegularSetting;
        /**
         * Check if settings or tag key contains whitespace and warn about it.
         * Ignore any settings in [properties] section.
         */
        private checkSettingsWhitespaces;
        /**
         * Updates the lastCondition field
         */
        private setLastCondition;
        /**
         * Checks spelling mistakes in a section name
         */
        private spellingCheck;
        /**
         * Calls corresponding functions for the found keyword
         */
        private switchKeyword;
        /**
         * Performs type checks for the found setting value
         * @param setting the setting to be checked
         */
        private typeCheck;
        /**
         * Creates diagnostics for a CSV line containing wrong columns number
         */
        private validateCsv;
        /**
         * Creates diagnostics for unknown variables in `for` keyword
         * like `for srv in servers setting = @{server} endfor`
         * but `server` is undefined
         */
        private validateFor;
        private getSetting;
        private checkUrlPlaceholders;
        /**
         * Returns all placeholders declared before the current line.
         */
        private getUrlPlaceholders;
        /**
         * Creates Range object for the current line.
         *
         * @param start - The starting position in the string
         * @param length - Length of the word to be highlighted
         * @returns Range object with start equal to `start` and end equal to `start+length`
         */
        private createRange;
    }
}
