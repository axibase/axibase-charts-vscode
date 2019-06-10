import { Diagnostic } from "vscode-languageserver";
/**
 * Performs validation of a whole document line by line.
 */
export declare class Validator {
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
