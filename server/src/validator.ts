import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import {
    deprecatedTagSection, negativeStyleScope,
    settingNameInTags,
    settingsWithWhitespaces,
    tagNameWithWhitespaces,
    unknownToken
} from "./messageUtil";
import { RelatedSettingsChecker } from "./relatedSettingsChecker";
import { requiredSectionSettingsMap, settingsMap, widgetRequirementsByType } from "./resources";
import { SectionStack } from "./sectionStack";
import { Setting } from "./setting";
import { TextRange } from "./textRange";
import {
    countCsvColumns,
    createDiagnostic,
    deleteComments,
    isAnyInArray,
    isInMap,
    repetitionDiagnostic
} from "./util";

const placeholderContainingSettings = [
    "url", "urlparameters"
];

/**
 * Performs validation of a whole document line by line.
 */
export class Validator {
    /**
     * Array of declared aliases in the current widget
     */
    private readonly aliases: string[] = [];
    /**
     * Number of CSV columns in the current CSV header
     */
    private csvColumns?: number;
    /**
     * Index of the current line
     */
    private currentLineNumber: number = -1;
    /**
     * TextRange containing name and position of the current section declaration
     */
    private currentSection?: TextRange;
    /**
     * Contains sections hierarchy from configuration
     */
    private readonly sectionStack: SectionStack = new SectionStack();
    /**
     * Array of settings declared in current section
     */
    private currentSettings: Setting[] = [];
    /**
     * Array of settings declared in the current document
     */
    private allSettings: Setting[] = [];
    /**
     * Array of de-aliases (value('alias')) in the current widget
     */
    private readonly deAliases: TextRange[] = [];
    /**
     * The last found keyword (script, csv, var, for...) and the position
     */
    private foundKeyword?: TextRange;
    /**
     * Map of settings declared in if statement.
     * Key is line number and keyword. For example, "70if server == 'vps'", "29else".
     * Index is used to distinguish statements from each other
     */
    private readonly ifSettings: Map<string, Setting[]> = new Map<string, Setting[]>();
    /**
     * Stack of nested keywords. For example, if can be included to a for.
     */
    private readonly keywordsStack: TextRange[] = [];

    /**
     * Last if statement. Used to get/set settings in ifSettigns
     */
    private lastCondition?: string;
    /**
     * Array of lines of the current document
     */
    private readonly lines: string[];
    /**
     * Result of last regexp execution
     */
    private match?: RegExpExecArray | null;
    /**
     * Map of settings declared in parent sections. Keys are section names.
     */
    private readonly parentSettings: Map<string, Setting[]> = new Map<string, Setting[]>();
    /**
     * Position of declaration of previous section and the name of the section
     */
    private previousSection?: TextRange;
    /**
     * Settings declared in the previous section
     */
    private previousSettings: Setting[] = [];
    /**
     * Util class which helps to check related settings, for example, tresholds and colors.
     */
    private relatedSettingsChecker: RelatedSettingsChecker = new RelatedSettingsChecker();
    /**
     * Settings required to declare in the current section
     */
    private requiredSettings: Setting[][] = [];
    /**
     * Validation result
     */
    private readonly result: Diagnostic[] = [];
    /**
     * Map of settings in the current widget and their values
     */
    private readonly settingValues: Map<string, string> = new Map<string, string>();
    /**
     * Map of defined variables, where key is type (for, var, csv...)
     */
    private readonly variables: Map<string, string[]> = new Map([
        ["freemarker", ["entity", "entities", "type"]],
    ]);
    /**
     * Type of the current widget
     */
    private currentWidget?: string;

    public constructor(text: string) {
        this.lines = deleteComments(text)
            .split("\n");
    }

    /**
     * Iterates over the document content line by line
     * @returns diagnostics for all found mistakes
     */
    public lineByLine(): Diagnostic[] {
        if (this.currentLineNumber !== -1) {
            throw new Error("You should create a new Validator");
        }
        for (const line of this.lines) {
            this.currentLineNumber++;
            this.foundKeyword = TextRange.parse(line, this.currentLineNumber);

            if (this.isNotKeywordEnd("script") || this.isNotKeywordEnd("var")) {
                /**
                 *  Lines in multiline script and var sections
                 *  will be cheked in JavaScriptValidator.processScript() and processVar()
                 */
                continue;
            }
            if (this.isNotKeywordEnd("csv")) {
                this.validateCsv();
            }

            this.eachLine();

            if (this.foundKeyword !== undefined) {
                if (/\b(if|for|csv)\b/i.test(this.foundKeyword.text)) {
                    this.keywordsStack.push(this.foundKeyword);
                }

                this.switchKeyword();
            }
        }

        this.checkAliases();
        this.diagnosticForLeftKeywords();
        this.checkRequredSettingsForSection();
        this.result.push(...this.relatedSettingsChecker.check(true, this.currentSettings));
        this.result.push(...this.relatedSettingsChecker.check(false, this.allSettings));
        this.checkUrlPlaceholders();
        this.setSectionToStack(null);

        return this.result;
    }

    /**
     * Checks whether has the keyword ended or not
     * @param keyword keyword which is expected to end
     */
    private isNotKeywordEnd(keyword: string): boolean {
        return this.areWeIn(keyword) && (this.foundKeyword === undefined || this.foundKeyword.text !== `end${keyword}`);
    }

    /**
     * Adds all current section setting to parent
     * if they're required by a section
     */
    private addCurrentToParentSettings(): void {
        if (this.currentSection !== undefined) {
            for (const setting of this.currentSettings) {
                this.addToParentsSettings(this.currentSection.text, setting);
            }
        }
    }

    /**
     * Adds new entry to settingValue map based on this.match and sets value for setting.
     * @param setting setting to which value will be set
     */
    private addSettingValue(setting?: Setting): void {
        if (this.match == null) {
            throw new Error("Trying to add new entry to settingValue map based on undefined");
        }
        const name: string = Setting.clearSetting(this.match[2]);
        const value: string = Setting.clearValue(this.match[3]);
        this.settingValues.set(name, value);
        this.sectionStack.insertCurrentSetting(name, value);
        if (setting) {
            setting.value = value;
        }
    }

    /**
     * Adds a setting based on this.match to array
     * or creates a new diagnostic if setting is already present
     * @param array the target array
     * @returns the array containing the setting from this.match
     */
    private addToSettingArray(array?: Setting[]): Setting[] {
        const result: Setting[] = (array === undefined) ? [] : array;
        if (this.match == null) {
            return result;
        }
        const [, indent, name] = this.match;
        const variable: Setting | undefined = this.getSetting(name);
        if (variable === undefined) {
            return result;
        }
        if (result.includes(variable)) {
            const range: Range = Range.create(
                Position.create(this.currentLineNumber, indent.length),
                Position.create(this.currentLineNumber, indent.length + name.length),
            );
            this.result.push(repetitionDiagnostic(range, variable, name));
        } else {
            result.push(variable);
        }

        return result;
    }

    /**
     * Adds a setting based on this.match to the target map
     * or creates a new diagnostic if setting is already present
     * @param key the key, which value will contain the setting
     * @param setting which setting to add
     * @returns the map regardless was it modified or not
     */
    private addToParentsSettings(key: string, setting: Setting): void {
        let array: Setting[] | undefined = this.parentSettings.get(key);
        if (array === undefined) {
            array = [setting];
        } else {
            array.push(setting);
        }
        this.parentSettings.set(key, array);
    }

    /**
     * Adds a string based on this.match to the array
     * or creates a diagnostic if the string is already present
     * @param array  the target array
     * @returns the array regardless was it modified or not
     */
    private addToStringArray(array: string[]): string[] {
        const result: string[] = array;
        if (this.match == null) {
            return result;
        }
        const [, indent, variable] = this.match;
        if (array.includes(variable)) {
            this.result.push(createDiagnostic(
                Range.create(
                    Position.create(this.currentLineNumber, indent.length),
                    Position.create(this.currentLineNumber, indent.length + variable.length),
                ),
                `${variable} is already defined`,
            ));
        } else {
            result.push(variable);
        }

        return result;
    }

    /**
     * Adds a string based on this.match to a value of the provided key
     * @param map the target map
     * @param key the key which value will contain the setting
     * @returns the map regardless was it modified or not
     */
    private addToStringMap(map: Map<string, string[]>, key: string): Map<string, string[]> {
        if (this.match == null) {
            return map;
        }
        const [, indent, variable] = this.match;
        if (isInMap(variable, map)) {
            const startPosition: number = this.match.index + indent.length;
            this.result.push(createDiagnostic(
                Range.create(
                    Position.create(this.currentLineNumber, startPosition),
                    Position.create(this.currentLineNumber, startPosition + variable.length),
                ),
                `${variable} is already defined`,
            ));
        } else {
            let array: string[] | undefined = map.get(key);
            if (array === undefined) {
                array = [variable];
            } else {
                array.push(variable);
            }
            map.set(key, array);
        }

        return map;
    }

    /**
     * Tests if keywordsStack contain the provided name or not
     * @param name the target keyword name
     * @return true, if stack contains the keyword, false otherwise
     */
    private areWeIn(name: string): boolean {
        return this.keywordsStack
            .some((textRange: TextRange): boolean => textRange.text === name);
    }

    /**
     * Checks that each de-alias has corresponding alias
     */
    private checkAliases(): void {
        this.deAliases.forEach((deAlias: TextRange) => {
            if (!this.aliases.includes(deAlias.text)) {
                this.result.push(createDiagnostic(deAlias.range, unknownToken(deAlias.text)));
            }
        });
    }

    /**
     * Tests that user has finished a corresponding keyword
     * For instance, user can write "endfor" instead of "endif"
     * @param expectedEnd What the user has finished?
     */
    private checkEnd(expectedEnd: string): void {
        if (this.foundKeyword === undefined) {
            return;
        }
        const lastKeyword: string | undefined = this.getLastKeyword();
        if (lastKeyword === expectedEnd) {
            this.keywordsStack.pop();

            return;
        }
        if (!this.areWeIn(expectedEnd)) {
            this.result.push(createDiagnostic(
                this.foundKeyword.range,
                `${this.foundKeyword.text} has no matching ${expectedEnd}`,
            ));
        } else {
            const index: number =
                this.keywordsStack.findIndex((keyword: TextRange) => keyword.text === expectedEnd);
            this.keywordsStack.splice(index, 1);
            this.result.push(createDiagnostic(
                this.foundKeyword.range,
                `${expectedEnd} has finished before ${lastKeyword}`,
            ));
        }
    }

    /**
     * Check that the section does not contain settings
     * Which are excluded by the specified one
     * @param setting the specified setting
     */
    private checkExcludes(setting: Setting): void {
        if (this.match == null) {
            return;
        }
        const [, indent, name] = this.match;
        for (const item of this.currentSettings) {
            if (setting.excludes.includes(item.displayName)) {
                const range: Range = Range.create(
                    this.currentLineNumber, indent.length,
                    this.currentLineNumber, indent.length + name.length,
                );
                this.result.push(createDiagnostic(
                    range,
                    `${setting.displayName} can not be specified simultaneously with ${item.displayName}`,
                ));
            }
        }
    }

    /**
     */
    private checkFreemarker(): void {
        const line: string = this.getCurrentLine();
        this.match = /<\/?#.*?\/?>/.exec(line);
        if (this.match !== null) {
            this.result.push(createDiagnostic(
                Range.create(
                    this.currentLineNumber, this.match.index,
                    this.currentLineNumber, this.match.index + this.match[0].length,
                ),
                `Freemarker expressions are deprecated.\nUse a native collection: list, csv table, var object.` +
                `\nMigration examples are available at ` +
                `https://github.com/axibase/charts/blob/master/syntax/freemarker.md`,
                DiagnosticSeverity.Information,
            ));
            this.match = /(as\s*(\S+)>)/.exec(line);
            if (this.match) {
                this.addToStringArray(this.aliases);
            }
        }
    }

    /**
     * Creates diagnostics if the current section does not contain required settings
     */
    private checkRequredSettingsForSection(): void {
        if (this.currentSection === undefined) {
            return;
        }
        const sectionRequirements = requiredSectionSettingsMap.get(this.currentSection.text);
        if (!sectionRequirements) {
            return;
        }
        const required: Setting[][] | undefined = sectionRequirements.settings;
        if (required !== undefined) {
            this.requiredSettings = required.concat(this.requiredSettings);
        }
        const notFound: string[] = [];
        required: for (const options of this.requiredSettings) {
            const displayName: string = options[0].displayName;
            if (displayName === "metric") {
                const columnMetric: string | undefined = this.settingValues.get("columnmetric");
                const columnValue: string | undefined = this.settingValues.get("columnvalue");
                if (columnMetric === "null" && columnValue === "null") {
                    continue;
                }
                const changeField: string | undefined = this.settingValues.get("changefield");
                if (/metric/.test(changeField)) {
                    continue;
                }
            }
            if (isAnyInArray(options, this.currentSettings)) {
                continue;
            }
            for (const array of this.parentSettings.values()) {
                // Trying to find in this section parents
                if (isAnyInArray(options, array)) {
                    continue required;
                }
            }
            if (this.ifSettings.size > 0) {
                for (const array of this.ifSettings.values()) {
                    // Trying to find in each one of if-elseif-else... statement
                    if (!isAnyInArray(options, array)) {
                        notFound.push(displayName);
                        continue required;
                    }
                }
                let ifCounter: number = 0;
                let elseCounter: number = 0;
                for (const statement of this.ifSettings.keys()) {
                    if (/\bif\b/.test(statement)) {
                        ifCounter++;
                    } else if (/\belse\b/.test(statement)) {
                        elseCounter++;
                    }
                }
                if (ifCounter === elseCounter) {
                    continue;
                }
            }
            notFound.push(displayName);
        }
        for (const option of notFound) {
            this.result.push(createDiagnostic(this.currentSection.range, `${option} is required`));
        }
        this.requiredSettings.splice(0, this.requiredSettings.length);
    }

    /**
     * Creates a new diagnostic if the provided setting is defined
     * @param setting the setting to perform check
     */
    private checkRepetition(setting: Setting): void {
        if (this.match == null) {
            return;
        }
        const [, indent, name] = this.match;
        const range: Range = Range.create(
            this.currentLineNumber, indent.length,
            this.currentLineNumber, indent.length + name.length,
        );

        if (this.areWeIn("if")) {
            if (this.lastCondition === undefined) {
                throw new Error("We are in if, but last condition is undefined");
            }
            let array: Setting[] | undefined = this.ifSettings.get(this.lastCondition);
            array = this.addToSettingArray(array);
            this.ifSettings.set(this.lastCondition, array);
            if (this.currentSettings.includes(setting)) {
                // The setting was defined before if
                this.result.push(repetitionDiagnostic(range, setting, name));
            }
        } else {
            this.addToSettingArray(this.currentSettings);
        }
    }

    /**
     * Creates diagnostics for all unclosed keywords
     */
    private diagnosticForLeftKeywords(): void {
        for (const nestedConstruction of this.keywordsStack) {
            this.result.push(createDiagnostic(
                nestedConstruction.range,
                `${nestedConstruction.text} has no matching end${nestedConstruction.text}`,
            ));
        }
    }

    /**
     * Handles every line in the document, calls corresponding functions
     */
    private eachLine(): void {
        this.checkFreemarker();
        const line: string = this.getCurrentLine();
        this.match = /(^[\t ]*\[)(\w+)\][\t ]*/.exec(line);
        if ( // Section declaration, for example, [widget]
            this.match !== null ||
            /**
             * We are in [tags] section and current line is empty - [tags] section has finished
             */
            (line.trim().length === 0 && this.currentSection !== undefined && this.currentSection.text === "tags")) {
            // We met start of the next section, that means that current section has finished
            if (this.match !== null) {
                this.spellingCheck();
            }
            this.handleSection();
        } else {
            this.match = /(^\s*)([a-z].*?[a-z])\s*=\s*(.*?)\s*$/.exec(line);
            if (this.match !== null) {
                // Setting declaration, for example, width-units = 6.2
                this.checkSettingsWhitespaces();
                this.handleSettings();
                if (this.areWeIn("for")) {
                    this.validateFor();
                }
            }
            this.match = /(^\s*\[)(\w+)\s*$/.exec(line);
            if (this.match !== null) {
                this.result.push(createDiagnostic(
                    Range.create(
                        this.currentLineNumber, this.match[1].length,
                        this.currentLineNumber, this.match[1].length + this.match[2].length,
                    ),
                    "Section tag is unclosed",
                ));
            }
        }
    }

    /**
     * Adds all de-aliases from the line to the corresponding array
     */
    private findDeAliases(): void {
        const line: string = this.getCurrentLine();
        const regexp: RegExp = /value\((['"])(\S+?)\1\)/g;
        const deAliasPosition: number = 2;
        let freemarkerExpr: RegExpExecArray | null;
        let deAlias: string;
        this.match = regexp.exec(line);
        while (this.match !== null) {
            deAlias = this.match[deAliasPosition];
            freemarkerExpr = /(\$\{(\S+)\})/.exec(deAlias);
            if (freemarkerExpr) {
                // extract "lpar" from value('${lpar}PX')
                deAlias = freemarkerExpr[deAliasPosition];
            }
            this.deAliases.push(new TextRange(deAlias, Range.create(
                this.currentLineNumber, line.indexOf(deAlias),
                this.currentLineNumber, line.indexOf(deAlias) + deAlias.length,
            )));
            this.match = regexp.exec(line);
        }
    }

    /**
     * Gets current line
     * @returns current line
     */
    private getCurrentLine(): string {
        const line: string | null = this.getLine(this.currentLineNumber);
        if (line === null) {
            throw new Error(`Line counter ${this.currentLineNumber} points to nowhere`);
        }

        return line;
    }

    /**
     * Returns the keyword from the top of keywords stack without removing it
     * @returns the keyword which is on the top of keywords stack
     */
    private getLastKeyword(): string | undefined {
        if (this.keywordsStack.length === 0) {
            return undefined;
        }
        const stackHead: TextRange = this.keywordsStack[this.keywordsStack.length - 1];

        return stackHead.text;
    }

    /**
     * Lower-cases and returns the text on the line with the provided number
     * @param line line number
     * @returns undefined if line number is higher that number of lines, corresponding line otherwise
     */
    private getLine(line: number): string | null {
        return (line < this.lines.length && line >= 0) ? this.lines[line].toLowerCase() : null;
    }

    /**
     * Creates a diagnostic about unknown setting name or returns the setting
     * @returns undefined if setting is unknown, setting otherwise
     */
    private getSettingCheck(): Setting | undefined {
        if (this.match == null) {
            return undefined;
        }
        const name: string = this.match[2];
        if (/column-/.test(name)) {
            return undefined;
        }
        let setting: Setting | undefined = this.getSetting(name);
        if (setting === undefined) {
            if (TextRange.KEYWORD_REGEXP.test(name)) {
                return undefined;
            }
            if (this.currentSection !== undefined && (this.currentSection.text === "placeholders" ||
                this.currentSection.text === "properties")) {
                return undefined;
            }
            const message: string = unknownToken(name);
            this.result.push(createDiagnostic(
                Range.create(
                    this.currentLineNumber, this.match[1].length,
                    this.currentLineNumber, this.match[1].length + name.length,
                ),
                message,
            ));

            return undefined;
        }

        setting = setting.applyScope({
            section: this.currentSection ? this.currentSection.text.trim() : "",
            widget: this.currentWidget || "",
        });

        return setting;
    }

    /**
     * Calculates the number of columns in the found csv header
     */
    private handleCsv(): void {
        const line: string = this.getCurrentLine();
        let header: string | null;
        if (/=[ \t]*$/m.test(line)) {
            let j: number = this.currentLineNumber + 1;
            header = this.getLine(j);
            while (header !== null && /^[ \t]*$/m.test(header)) {
                header = this.getLine(++j);
            }
        } else {
            const match: RegExpExecArray | null = /=/.exec(line);
            if (match === null) {
                throw new Error("The line does not contain a '='");
            }
            header = line.substring(match.index + 1);
        }
        this.match = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*=/m.exec(line);
        this.addToStringMap(this.variables, "csvNames");
        this.csvColumns = (header === null) ? 0 : countCsvColumns(header);
    }

    /**
     * Creates a diagnostic if `else` is found, but `if` is not
     * or `if` is not the last keyword
     */
    private handleElse(): void {
        if (this.foundKeyword === undefined) {
            throw new Error(`We're trying to handle 'else', but foundKeyword is ${this.foundKeyword}`);
        }
        this.setLastCondition();
        let message: string | undefined;
        if (!this.areWeIn("if")) {
            message = `${this.foundKeyword.text} has no matching if`;
        } else if (this.getLastKeyword() !== "if") {
            message = `${this.foundKeyword.text} has started before ${this.getLastKeyword()} has finished`;
        }
        if (message !== undefined) {
            this.result.push(createDiagnostic(this.foundKeyword.range, message));
        }
    }

    /**
     * Removes the variable from the last `for`
     */
    private handleEndFor(): void {
        let forVariables: string[] | undefined = this.variables.get("forVariables");
        if (forVariables === undefined) {
            forVariables = [];
        } else {
            forVariables.pop();
        }
        this.variables.set("forVariables", forVariables);
    }

    /**
     * Creates diagnostics related to `for ... in _here_` statements
     * Like "for srv in servers", but "servers" is not defined
     * Also adds the new `for` variable to the corresponding map
     */
    private handleFor(): void {
        const line: string = this.getCurrentLine();
        this.match = /(^\s*for\s+)(\w+)\s+in/m.exec(line);
        if (this.match !== null) {
            const matching: RegExpExecArray = this.match;
            // tslint:disable-next-line:max-line-length
            this.match = /^([ \t]*for[ \t]+\w+[ \t]+in[ \t]+)(?:Object\.keys\((\w+)(?:\.\w+)*\)|(\w+))[\[\]\d]*$/im.exec(line);
            /**
             * First part "^([ \t]*for[ \t]+\w+[ \t]+in[ \t]+)" mathes "for <alias> in", for example "for agent in".
             * Second part "(?:Object\.keys\((\w+)(?:\.\w+)*\)|(\w+))[\[\]\d]*$"
             * matches variable "apps" in the following cases:
             * 1) for agent in Object.keys(apps)
             * 2) for agent in Object.keys(apps.tags)
             * 3) for agent in apps
             * 4) for agent in apps[2]
             */
            if (this.match !== null) {
                const [, forIn, key, collection] = this.match;
                const range: Range = Range.create(
                    this.currentLineNumber, forIn.length,
                    this.currentLineNumber, forIn.length,
                );
                let variable: string;
                if (key !== undefined) {
                    range.start.character += "Object.keys(".length;
                    range.end.character += "Object.keys(".length;
                    variable = key;
                } else {
                    variable = collection;
                }
                range.end.character += variable.length;
                if (!isInMap(variable, this.variables)) {
                    const message: string = unknownToken(variable);
                    this.result.push(createDiagnostic(range, message));
                }
            } else {
                this.result.push(createDiagnostic(
                    Range.create(
                        Position.create(this.currentLineNumber, matching[0].length - "in".length),
                        Position.create(this.currentLineNumber, matching[0].length),
                    ),
                    "Empty 'in' statement",
                ));
            }
            this.match = matching;
            this.addToStringMap(this.variables, "forVariables");
        }
    }

    /**
     * Adds new variable to corresponding map,
     * Pushes a new keyword to the keyword stack
     * If necessary (`list hello = value1, value2` should not be closed)
     */
    private handleList(): void {
        if (this.foundKeyword === undefined) {
            throw new Error(`We're trying to handle 'list', but foundKeyword is ${this.foundKeyword}`);
        }
        const line: string = this.getCurrentLine();
        this.match = /(^\s*list\s+)(\w+)\s*=/.exec(line);
        this.addToStringMap(this.variables, "listNames");
        if (/(=|,)[ \t]*$/m.test(line)) {
            this.keywordsStack.push(this.foundKeyword);
        } else {
            let j: number = this.currentLineNumber + 1;
            let nextLine: string | null = this.getLine(j);
            while (nextLine !== null && /^[ \t]*$/m.test(nextLine)) {
                nextLine = this.getLine(++j);
            }
            if (nextLine !== null && (/^[ \t]*,/.test(nextLine) || /\bendlist\b/.test(nextLine))) {
                this.keywordsStack.push(this.foundKeyword);
            }
        }
    }

    /**
     * Adds new keyword to the keywords stack if necessary
     * (`script = console.log("Hello World!")` should not be closed)
     */
    private handleScript(): void {
        if (this.foundKeyword === undefined) {
            throw new Error(`We're trying to handle 'script', but foundKeyword is ${this.foundKeyword}`);
        }
        const line: string = this.getCurrentLine();
        if (/^\s*script\s*=.*$/m.test(line)) {
            return;
        }
        this.keywordsStack.push(this.foundKeyword);
        this.match = /(^\s*)script\s*\S/.exec(line);
        if (this.match !== null) {
            this.result.push(createDiagnostic(
                Range.create(
                    this.currentLineNumber, this.match[1].length,
                    this.currentLineNumber, this.match[1].length + "script".length,
                ),
                "A linefeed character after 'script' keyword is required",
            ));
        }
    }

    /**
     * Performs required operations after a section has finished.
     * Mostly empties arrays.
     */
    private handleSection(): void {
        this.checkRequredSettingsForSection();
        this.addCurrentToParentSettings();
        this.result.push(...this.relatedSettingsChecker.check(true, this.currentSettings));
        if (this.match == null) {
            if (this.previousSection !== undefined) {
                this.currentSection = this.previousSection;
                this.currentSettings = this.previousSettings;
            }

            return;
        }
        const [, indent, name] = this.match;
        if (/widget/i.test(name)) {
            this.checkAliases();
            this.deAliases.splice(0, this.deAliases.length);
            this.aliases.splice(0, this.aliases.length);
            this.settingValues.clear();
        }
        this.checkUrlPlaceholders();
        this.previousSettings = this.currentSettings.splice(0, this.currentSettings.length);
        this.previousSection = this.currentSection;
        this.ifSettings.clear();
        this.currentSection = new TextRange(name, Range.create(
            this.currentLineNumber, indent.length,
            this.currentLineNumber, indent.length + name.length,
        ));
        this.parentSettings.delete(this.currentSection.text);
        this.setSectionToStack(this.currentSection);
    }

    /**
     * Attempts to add section to section stack, displays error if section
     * is out ouf hierarchy, unknown or has unresolved section dependencies
     * If section is null, finalizes section stack and return summary error
     * @param section section to add or null
     */
    private setSectionToStack(section: TextRange | null): void {
        let sectionStackError: Diagnostic | null;
        if (section == null) {
            sectionStackError = this.sectionStack.finalize();
        } else {
            sectionStackError = this.sectionStack.insertSection(this.currentSection);
        }
        if (sectionStackError) {
            this.result.push(sectionStackError);
        }
    }

    /**
     * Calls functions in proper order to handle a found setting
     */
    private handleSettings(): void {
        if (this.match == null) {
            return;
        }
        const line: string = this.getCurrentLine();
        if (this.currentSection === undefined || !/(?:tag|key)s?/.test(this.currentSection.text)) {
            this.handleRegularSetting();
        } else if (/(?:tag|key)s?/.test(this.currentSection.text) &&
            // We are in tags/keys section
            /(^[ \t]*)([a-z].*?[a-z])[ \t]*=/.test(line)) {
            this.match = /(^[ \t]*)([a-z].*?[a-z])[ \t]*=/.exec(line);
            if (this.match === null) {
                return;
            }
            const [, indent, name] = this.match;
            const setting: Setting | undefined = this.getSetting(name);
            if (this.isAllowedWidget(setting)) {
                this.result.push(createDiagnostic(
                    Range.create(
                        this.currentLineNumber, indent.length,
                        this.currentLineNumber, indent.length + name.length,
                    ),
                    settingNameInTags(name), DiagnosticSeverity.Information,
                ));
            }
        }
    }

    /**
     * Checks whether the setting is defined and is allowed to be defined in the current widget
     * @param setting the setting to be checked
     */
    private isAllowedWidget(setting: Setting): boolean {
        return setting !== undefined
            && this.currentSection.text !== "tag"
            && (setting.widget == null
                || this.currentWidget === undefined
                || setting.widget === this.currentWidget);
    }

    /**
     * Processes a regular setting which is defined not in tags/keys section
     */
    private handleRegularSetting(): void {
        const line: string = this.getCurrentLine();
        const setting: Setting | undefined = this.getSettingCheck();
        this.addSettingValue(setting);
        if (setting === undefined) {
            return;
        }
        this.allSettings.push(setting);

        if (setting.name === "type") {
            this.currentWidget = this.match[3];
            let reqs = widgetRequirementsByType.get(this.currentWidget);
            if (reqs && reqs.sections) {
                this.sectionStack.setSectionRequirements("widget", reqs.sections);
            }
        }

        if (!setting.multiLine) {
            this.checkRepetition(setting);
        } else {
            this.currentSettings.push(setting);
        }
        this.typeCheck(setting);
        this.checkExcludes(setting);
        this.checkNegativeStyle(setting);

        // Aliases
        if (setting.name === "alias") {
            this.match = /(^\s*alias\s*=\s*)(\S+)\s*$/m.exec(line);
            this.addToStringArray(this.aliases);
        }
        this.findDeAliases();
    }

    /**
     * Check if settings or tag key contains whitespace and warn about it.
     * Ignore any settings in [properties] section.
     */
    private checkSettingsWhitespaces(): void {
        const line: string = this.lines[this.currentLineNumber];
        const match: RegExpMatchArray = /(^\s*)((\w+\s+)+\w+)\s*=\s*(.+?)\s*$/.exec(line);
        if (match != null && match[2]) {
            const settingName: string = match[2];
            if (settingName && !this.foundKeyword && /^\w+(\s.*\w)+$/.test(settingName)) {
                const start: number = line.indexOf(settingName);
                const range: Range = Range.create(
                    Position.create(this.currentLineNumber, start),
                    Position.create(this.currentLineNumber, start + settingName.length),
                );
                if (this.currentSection.text === "tags") {
                    if (!/^["].+["]$/.test(settingName)) {
                        this.result.push(createDiagnostic(
                            range, tagNameWithWhitespaces(settingName), DiagnosticSeverity.Warning,
                        ));
                    }
                } else if (this.currentSection.text !== "properties") {
                    this.result.push(createDiagnostic(
                        range, settingsWithWhitespaces(settingName), DiagnosticSeverity.Warning,
                    ));
                }
            }
        }
    }

    /**
     * Updates the lastCondition field
     */
    private setLastCondition(): void {
        this.lastCondition = `${this.currentLineNumber}${this.getCurrentLine()}`;
    }

    /**
     * Checks spelling mistakes in a section name
     */
    private spellingCheck(): void {
        if (this.match == null) {
            return;
        }
        const indent: number = this.match[1].length;
        const word: string = this.match[2];
        const range: Range = Range.create(
            Position.create(this.currentLineNumber, indent),
            Position.create(this.currentLineNumber, indent + word.length),
        );

        if (word === "tag") {
            this.result.push(createDiagnostic(range, deprecatedTagSection, DiagnosticSeverity.Warning));
        }
    }

    /**
     * Calls corresponding functions for the found keyword
     */
    private switchKeyword(): void {
        if (this.foundKeyword === undefined) {
            throw new Error(`We're trying to handle a keyword, but foundKeyword is ${this.foundKeyword}`);
        }
        const line: string = this.getCurrentLine();
        switch (this.foundKeyword.text) {
            case "endfor":
                this.handleEndFor();
            case "endif":
            case "endvar":
            case "endcsv":
            case "endlist":
            case "endscript": {
                const expectedEnd: string = this.foundKeyword.text.substring("end".length);
                this.checkEnd(expectedEnd);
                break;
            }
            case "else":
            case "elseif": {
                this.handleElse();
                break;
            }
            case "csv": {
                this.handleCsv();
                break;
            }
            case "var": {
                const openBrackets: RegExpMatchArray | null = line.match(/((\s*[\[\{\(]\s*)+)/g);
                const closeBrackets: RegExpMatchArray | null = line.match(/((\s*[\]\}\)]\s*)+)/g);
                if (openBrackets) {
                    if (closeBrackets && openBrackets.map((s: string) => s.trim()).join("").length !==
                        closeBrackets.map((s: string) => s.trim()).join("").length
                        || closeBrackets === null) {
                        // multiline var
                        this.keywordsStack.push(this.foundKeyword);
                    }
                }
                this.match = /(var\s*)(\w+)\s*=/.exec(line);
                this.addToStringMap(this.variables, "varNames");
                break;
            }
            case "list": {
                this.handleList();
                break;
            }
            case "for": {
                this.handleFor();
                break;
            }
            case "if": {
                this.setLastCondition();
                break;
            }
            case "script": {
                this.handleScript();
                break;
            }
            case "import":
                break;
            default:
                throw new Error(`${this.foundKeyword.text} is not handled`);
        }
    }

    /**
     * Performs type checks for the found setting value
     * @param setting the setting to be checked
     */
    private typeCheck(setting: Setting): void {
        if (this.match == null) {
            return;
        }
        const range: Range = Range.create(
            this.currentLineNumber, this.match[1].length,
            this.currentLineNumber, this.match[1].length + this.match[2].length,
        );
        const diagnostic: Diagnostic | undefined = setting.checkType(range);
        if (diagnostic != null) {
            this.result.push(diagnostic);
        }
    }

    /**
     * Creates diagnostics for a CSV line containing wrong columns number
     */
    private validateCsv(): void {
        const line: string = this.getCurrentLine();
        const columns: number = countCsvColumns(line);
        if (columns !== this.csvColumns && !/^[ \t]*$/m.test(line)) {
            this.result.push(createDiagnostic(
                Range.create(this.currentLineNumber, 0, this.currentLineNumber, line.length),
                `Expected ${this.csvColumns} columns, but found ${columns}`,
            ));
        }
    }

    /**
     * Creates diagnostics for unknown variables in `for` keyword
     * like `for srv in servers setting = @{server} endfor`
     * but `server` is undefined
     */
    private validateFor(): void {
        const line: string = this.getCurrentLine();
        const atRegexp: RegExp = /@{.+?}/g;
        this.match = atRegexp.exec(line);
        while (this.match !== null) {
            const substr: string = this.match[0];
            const startPosition: number = this.match.index;
            const varRegexp: RegExp = /[a-zA-Z_]\w*(?!\w*["\('])/g;
            this.match = varRegexp.exec(substr);
            while (this.match !== null) {
                if (substr.charAt(this.match.index - 1) === ".") {
                    this.match = varRegexp.exec(substr);
                    continue;
                }
                const variable: string = this.match[0];
                if (!isInMap(variable, this.variables)) {
                    const position: number = startPosition + this.match.index;
                    const message: string = unknownToken(variable);
                    this.result.push(createDiagnostic(
                        Range.create(
                            this.currentLineNumber, position,
                            this.currentLineNumber, position + variable.length,
                        ),
                        message,
                    ));
                }
                this.match = varRegexp.exec(substr);
            }
            this.match = atRegexp.exec(line);
        }
    }

    private checkNegativeStyle(setting: Setting) {
        if (this.currentSection && this.currentSection.text === "widget") {
            const typeSetting = this.getSectionSetting("type");
            const modeSetting = this.getSectionSetting("mode");
            const negativeStyleSetting = this.getSectionSetting("negativestyle");
            if (typeSetting && negativeStyleSetting) {
                const possibleType = "chart";
                const possibleModes = ["column", "column-stack"];
                const textRange = negativeStyleSetting.textRange ? negativeStyleSetting.textRange : setting.textRange;
                const widgetMode = modeSetting ? this.getSectionSettingValue(modeSetting.name) : undefined;
                if (possibleType !== this.getSectionSettingValue(typeSetting.name)
                    || modeSetting && possibleModes.indexOf(widgetMode) < 0) {
                    this.result.push(createDiagnostic(
                        textRange,
                        negativeStyleScope(),
                        DiagnosticSeverity.Warning
                    ));
                }
            }
        }
    }

    private getSectionSettingValue(settingName: string) {
        const value = this.settingValues.get(settingName);
        return value ? value : Setting.clearValue(this.match[3]);
    }

    private getSectionSetting(settingName: string): Setting | undefined {
        const currentSetting = Setting.clearSetting(this.match[2]);
        if (currentSetting === settingName) {
            return this.getSetting(settingName);
        } else {
            return this.currentSettings
                .find(s => s.name === settingName);
        }
    }

    private getSetting(name: string): Setting | undefined {
        const clearedName: string = Setting.clearSetting(name);

        const line = this.getCurrentLine();
        const start: number = line.indexOf(name);
        const range: Range = (start > -1) ? Range.create(
            Position.create(this.currentLineNumber, start),
            Position.create(this.currentLineNumber, start + name.length),
        ) : undefined;
        const setting = settingsMap.get(clearedName);
        if (setting && range) {
            setting.textRange = range;
        }
        return setting;
    }

    private checkUrlPlaceholders() {
        let phs = this.getUrlPlaceholders();
        if (phs.length > 0) {
            if (this.currentSection && this.currentSection.text.match(/widget/i)) {
                this.sectionStack.requireSections("widget", "placeholders");
            }
        }
        let placeholderRange = this.sectionStack.getSectionRange("placeholders");
        if (placeholderRange) {
            let phValues = this.sectionStack.getSectionSettings("placeholders", false);
            let missingPhs = phs.filter(key => phValues.get(Setting.clearValue(key)) == null);
            if (missingPhs.length > 0) {
                this.result.push(createDiagnostic(
                    placeholderRange.range,
                    `Missing placeholders: ${missingPhs.join(", ")}.`,
                    DiagnosticSeverity.Error
                ));
            }
            let unnecessaryPhs = [...phValues.keys()].filter(key => !phs.includes(key));
            if (unnecessaryPhs.length > 0) {
                this.result.push(createDiagnostic(
                    placeholderRange.range,
                    `Unnecessary placeholders: ${unnecessaryPhs.join(", ")}.`,
                    DiagnosticSeverity.Warning
                ));
            }
        }
    }

    private getUrlPlaceholders(): string[] {
        let result = new Set();
        for (let setting of placeholderContainingSettings) {
            let value = this.sectionStack.getCurrentSetting(setting);
            if (value) {
                const regexp: RegExp = /{(.+?)}/g;
                let match = regexp.exec(value);
                while (match !== null) {
                    const cleared: string = Setting.clearSetting(match[1]);
                    result.add(cleared);
                    match = regexp.exec(value);
                }
            }
        }
        return [...result];
    }
}
