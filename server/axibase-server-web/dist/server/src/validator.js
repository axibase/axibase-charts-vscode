define(["require", "exports", "vscode-languageserver-types", "./config", "./configTree/configTree", "./configTree/configTreeValidator", "./defaultSetting", "./keywordHandler", "./messageUtil", "./resources", "./sectionStack", "./setting", "./textRange", "./util"], function (require, exports, vscode_languageserver_types_1, config_1, configTree_1, configTreeValidator_1, defaultSetting_1, keywordHandler_1, messageUtil_1, resources_1, sectionStack_1, setting_1, textRange_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const placeholderContainingSettings = [
        "url", "urlparameters"
    ];
    /** Regular expressions for CSV syntax checking */
    /**
     * RegExp for: `csv <name> =
     *              <header1>, <header2>`
     */
    const CSV_NEXT_LINE_HEADER_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(=)/m;
    /**
     * RegExp for: 'csv <name> = <header1>, <header2>'
     */
    const CSV_INLINE_HEADER_PATTERN = /=[ \t]*$/m;
    /**
     * RegExp for: 'csv <name> from <url>'
     */
    const CSV_FROM_URL_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(from)/m;
    /**
     * RegExp for blank line
     */
    const BLANK_LINE_PATTERN = /^[ \t]*$/m;
    /**
     * RegExp for 'csv' keyword
     */
    const CSV_KEYWORD_PATTERN = /\b(csv)\b/i;
    /**
     * Performs validation of a whole document line by line.
     */
    class Validator {
        constructor(text) {
            /**
             * Array of declared aliases in the current widget
             */
            this.aliases = [];
            /**
             * Contains sections hierarchy from configuration
             */
            this.sectionStack = new sectionStack_1.SectionStack();
            /**
             * Array of settings declared in current section
             */
            this.currentSettings = [];
            /**
             * Array of de-aliases (value('alias')) in the current widget
             */
            this.deAliases = [];
            /**
             * Map of settings declared in if statement.
             * Key is line number and keyword. For example, "70if server == 'vps'", "29else".
             * Index is used to distinguish statements from each other
             */
            this.ifSettings = new Map();
            /**
             * Stack of nested keywords. For example, if can be included to a for.
             */
            this.keywordsStack = [];
            /**
             * Map of settings declared in parent sections. Keys are section names.
             */
            this.parentSettings = new Map();
            /**
             * Settings declared in the previous section
             */
            this.previousSettings = [];
            /**
             * Settings required to declare in the current section
             */
            this.requiredSettings = [];
            /**
             * Validation result
             */
            this.result = [];
            /**
             * Map of settings in the current widget and their values
             */
            this.settingValues = new Map();
            /**
             * Map of defined variables, where key is type (for, var, csv...)
             */
            this.variables = new Map([
                ["freemarker", ["entity", "entities", "type"]],
            ]);
            /**
             * Line number of last "endif" keyword
             */
            this.lastEndIf = undefined;
            this.configTree = new configTree_1.ConfigTree();
            this.config = new config_1.Config(text);
            this.keywordHandler = new keywordHandler_1.KeywordHandler(this.keywordsStack);
        }
        /**
         * Iterates over the document content line by line
         * @returns diagnostics for all found mistakes
         */
        lineByLine() {
            for (const line of this.config) {
                /**
                 * At the moment 'csv <name> from <url>' supports unclosed syntax
                 */
                let canBeSingle = false;
                if (CSV_KEYWORD_PATTERN.test(line)) {
                    canBeSingle = !CSV_INLINE_HEADER_PATTERN.test(line) && !CSV_NEXT_LINE_HEADER_PATTERN.test(line);
                }
                this.foundKeyword = textRange_1.TextRange.parse(line, this.config.currentLineNumber, canBeSingle);
                if (this.isNotKeywordEnd("script") || this.isNotKeywordEnd("var") || this.isNotKeywordEnd("sql")) {
                    /**
                     * Lines in multiline script and var sections
                     * will be cheked in JavaScriptValidator.processScript() and processVar().
                     * SQL-block must be skipped without any processing.
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
            this.checkUrlPlaceholders();
            this.setSectionToStackAndTree(null);
            /**
             * Apply checks, which require walking through the ConfigTree.
             */
            let rulesDiagnostics = configTreeValidator_1.ConfigTreeValidator.validate(this.configTree);
            /**
             * Ugly hack. Removes duplicates from rulesDiagnostics.
             */
            rulesDiagnostics = [
                ...rulesDiagnostics.reduce(((allItems, item) => allItems.has(item.range) ? allItems : allItems.set(item.range, item)), new Map()).values()
            ];
            this.result.push(...rulesDiagnostics);
            return this.result.concat(this.keywordHandler.diagnostics);
        }
        /**
         * Checks whether has the keyword ended or not
         * @param keyword keyword which is expected to end
         */
        isNotKeywordEnd(keyword) {
            return this.areWeIn(keyword) && (this.foundKeyword === undefined || this.foundKeyword.text !== `end${keyword}`);
        }
        /**
         * Adds all current section setting to parent
         * if they're required by a section
         */
        addCurrentToParentSettings() {
            if (this.currentSection !== undefined) {
                for (const setting of this.currentSettings) {
                    this.addToParentsSettings(this.currentSection.text, setting);
                }
            }
        }
        /**
         * Adds new entry to settingValue map and new Setting to SectionStack
         * based on this.match, also sets value for setting.
         * @param setting setting to which value will be set
         */
        addSettingValue(setting) {
            if (this.match == null) {
                throw new Error("Trying to add new entry to settingValues map and sectionStack based on undefined");
            }
            const value = setting_1.Setting.clearValue(this.match[3]);
            setting.value = value;
            this.settingValues.set(setting.name, value);
        }
        /**
         * Adds a setting based on this.match to array
         * or creates a new diagnostic if setting is already present
         * @param array the target array
         * @returns the array containing the setting from this.match
         */
        addToSettingArray(variable, array) {
            const result = (array === undefined) ? [] : array;
            if (this.match == null) {
                return result;
            }
            const [, indent, name] = this.match;
            if (variable === undefined) {
                return result;
            }
            const declaredAbove = result.find(v => v.name === variable.name);
            if (declaredAbove !== undefined) {
                const range = this.createRange(indent.length, name.length);
                this.result.push(util_1.repetitionDiagnostic(range, declaredAbove, variable));
            }
            else {
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
        addToParentsSettings(key, setting) {
            let array = this.parentSettings.get(key);
            if (array === undefined) {
                array = [setting];
            }
            else {
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
        addToStringArray(array) {
            const result = array;
            if (this.match == null) {
                return result;
            }
            const [, indent, variable] = this.match;
            if (array.includes(variable)) {
                this.result.push(util_1.createDiagnostic(this.createRange(indent.length, variable.length), `${variable} is already defined`));
            }
            else {
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
        addToStringMap(map, key) {
            if (this.match == null) {
                return map;
            }
            const [, indent, variable] = this.match;
            if (util_1.isInMap(variable, map)) {
                const startPosition = this.match.index + indent.length;
                this.result.push(util_1.createDiagnostic(this.createRange(startPosition, variable.length), `${variable} is already defined`));
            }
            else {
                let array = map.get(key);
                if (array === undefined) {
                    array = [variable];
                }
                else {
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
        areWeIn(name) {
            return this.keywordsStack
                .some((textRange) => textRange.text === name);
        }
        /**
         * Checks that each de-alias has corresponding alias
         */
        checkAliases() {
            this.deAliases.forEach((deAlias) => {
                if (!this.aliases.includes(deAlias.text)) {
                    this.result.push(util_1.createDiagnostic(deAlias.range, messageUtil_1.unknownToken(deAlias.text)));
                }
            });
        }
        /**
         * Tests that user has finished a corresponding keyword
         * For instance, user can write "endfor" instead of "endif"
         * @param expectedEnd What the user has finished?
         */
        checkEnd(expectedEnd) {
            if (this.foundKeyword === undefined) {
                return;
            }
            const lastKeyword = this.getLastKeyword();
            if (lastKeyword === expectedEnd) {
                this.keywordsStack.pop();
                return;
            }
            if (!this.areWeIn(expectedEnd)) {
                this.result.push(util_1.createDiagnostic(this.foundKeyword.range, messageUtil_1.noMatching(this.foundKeyword.text, expectedEnd)));
            }
            else {
                const index = this.keywordsStack.findIndex((keyword) => keyword.text === expectedEnd);
                this.keywordsStack.splice(index, 1);
                this.result.push(util_1.createDiagnostic(this.foundKeyword.range, `${expectedEnd} has finished before ${lastKeyword}`));
            }
        }
        /**
         * Check that the section does not contain settings
         * Which are excluded by the specified one
         * @param setting the specified setting
         */
        checkExcludes(setting) {
            if (this.match == null) {
                return;
            }
            const [, indent, name] = this.match;
            for (const item of this.currentSettings) {
                if (setting.excludes.includes(item.displayName)) {
                    const range = this.createRange(indent.length, name.length);
                    this.result.push(util_1.createDiagnostic(range, `${setting.displayName} can not be specified simultaneously with ${item.displayName}`));
                }
            }
        }
        checkFreemarker() {
            const line = this.config.getCurrentLine();
            this.match = /<\/?#.*?\/?>/.exec(line);
            if (this.match !== null) {
                this.result.push(util_1.createDiagnostic(this.createRange(this.match.index, this.match[0].length), `Freemarker expressions are deprecated.\nUse a native collection: list, csv table, var object.` +
                    `\nMigration examples are available at ` +
                    `https://github.com/axibase/charts/blob/master/syntax/freemarker.md`, vscode_languageserver_types_1.DiagnosticSeverity.Information));
                this.match = /(as\s*(\S+)>)/.exec(line);
                if (this.match) {
                    this.addToStringArray(this.aliases);
                }
            }
        }
        /**
         * Creates diagnostics if the current section does not contain required settings.
         */
        checkRequredSettingsForSection() {
            if (this.currentSection === undefined) {
                return;
            }
            if (this.previousSection && /tag/i.test(this.currentSection.text)) {
                /**
                 * [tags] has finished, perform checks for parent section.
                 */
                this.currentSettings = this.previousSettings;
                this.currentSection = this.previousSection;
            }
            const sectionRequirements = resources_1.requiredSectionSettingsMap.get(this.currentSection.text);
            if (!sectionRequirements) {
                return;
            }
            const required = sectionRequirements.settings;
            if (required !== undefined) {
                this.requiredSettings = required.concat(this.requiredSettings);
            }
            const notFound = [];
            required: for (const options of this.requiredSettings) {
                const displayName = options[0].displayName;
                if (displayName === "metric") {
                    const columnMetric = this.settingValues.get("columnmetric");
                    const columnValue = this.settingValues.get("columnvalue");
                    if (columnMetric === "null" && columnValue === "null") {
                        continue;
                    }
                    const changeField = this.settingValues.get("changefield");
                    if (/metric/.test(changeField)) {
                        continue;
                    }
                }
                const optionsNames = options.map(s => s.name);
                if (util_1.isAnyInArray(optionsNames, this.currentSettings.map(s => s.name))) {
                    continue;
                }
                for (const array of this.parentSettings.values()) {
                    // Trying to find in this section parents
                    if (util_1.isAnyInArray(optionsNames, array.map(s => s.name))) {
                        continue required;
                    }
                }
                if (this.ifSettings.size > 0) {
                    for (const array of this.ifSettings.values()) {
                        // Trying to find in each one of if-elseif-else... statement
                        if (!util_1.isAnyInArray(optionsNames, array.map(s => s.name))) {
                            notFound.push(displayName);
                            continue required;
                        }
                    }
                    const curSectLine = this.currentSection.range.end.line;
                    const lastCondLine = parseInt(this.lastCondition.match(/^\d+/)[0], 10);
                    if ( // if-elseif-else statement inside the section
                    this.areWeIn("if") ||
                        // section inside the if-elseif-else statement
                        curSectLine < this.lastEndIf && curSectLine > lastCondLine) {
                        continue;
                    }
                    let ifCounter = 0;
                    let elseCounter = 0;
                    for (const statement of this.ifSettings.keys()) {
                        if (/\bif\b/.test(statement)) {
                            ifCounter++;
                        }
                        else if (/\belse\b/.test(statement)) {
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
                this.result.push(util_1.createDiagnostic(this.currentSection.range, `${option} is required`));
            }
            this.requiredSettings.splice(0, this.requiredSettings.length);
        }
        /**
         * Creates a new diagnostic if the provided setting is defined
         * @param setting the setting to perform check
         */
        checkRepetition(setting) {
            if (this.match == null) {
                return;
            }
            const [, indent, name] = this.match;
            const range = this.createRange(indent.length, name.length);
            if (this.areWeIn("if")) {
                if (this.lastCondition === undefined) {
                    throw new Error("We are in if, but last condition is undefined");
                }
                let array = this.ifSettings.get(this.lastCondition);
                array = this.addToSettingArray(setting, array);
                this.ifSettings.set(this.lastCondition, array);
                const declaredAbove = this.currentSettings.find(v => v.name === setting.name);
                if (declaredAbove !== undefined) {
                    // The setting was defined before if
                    this.result.push(util_1.repetitionDiagnostic(range, declaredAbove, setting));
                    return;
                }
            }
            else {
                this.addToSettingArray(setting, this.currentSettings);
            }
            this.sectionStack.insertCurrentSetting(setting);
        }
        /**
         * Creates diagnostics for all unclosed keywords
         */
        diagnosticForLeftKeywords() {
            for (const nestedConstruction of this.keywordsStack) {
                if (nestedConstruction.canBeUnclosed) {
                    continue;
                }
                this.result.push(util_1.createDiagnostic(nestedConstruction.range, messageUtil_1.noMatching(nestedConstruction.text, `end${nestedConstruction.text}`)));
            }
        }
        /**
         * Handles every line in the document, calls corresponding functions
         */
        eachLine() {
            this.checkFreemarker();
            const line = this.config.getCurrentLine();
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
            }
            else {
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
                    this.result.push(util_1.createDiagnostic(this.createRange(this.match[1].length, this.match[2].length), "Section tag is unclosed"));
                }
            }
        }
        /**
         * Adds all de-aliases from the line to the corresponding array
         */
        findDeAliases() {
            const line = this.config.getCurrentLine();
            const regexp = /value\((['"])(\S+?)\1\)/g;
            const deAliasPosition = 2;
            let freemarkerExpr;
            let deAlias;
            this.match = regexp.exec(line);
            while (this.match !== null) {
                deAlias = this.match[deAliasPosition];
                freemarkerExpr = /(\$\{(\S+)\})/.exec(deAlias);
                if (freemarkerExpr) {
                    // extract "lpar" from value('${lpar}PX')
                    deAlias = freemarkerExpr[deAliasPosition];
                }
                this.deAliases.push(new textRange_1.TextRange(deAlias, this.createRange(line.indexOf(deAlias), deAlias.length)));
                this.match = regexp.exec(line);
            }
        }
        /**
         * Returns the keyword from the top of keywords stack without removing it
         * @returns the keyword which is on the top of keywords stack
         */
        getLastKeyword() {
            if (this.keywordsStack.length === 0) {
                return undefined;
            }
            const stackHead = this.keywordsStack[this.keywordsStack.length - 1];
            return stackHead.text;
        }
        /**
         * Creates a diagnostic about unknown setting name or returns the setting
         * @returns undefined if setting is unknown, setting otherwise
         */
        getSettingCheck() {
            if (this.match == null) {
                return undefined;
            }
            const settingName = this.match[2];
            let setting = this.getSetting(settingName);
            if (setting === undefined) {
                if (/column-/.test(settingName)) {
                    return undefined;
                }
                if (textRange_1.TextRange.KEYWORD_REGEXP.test(settingName)) {
                    return undefined;
                }
                if (this.currentSection !== undefined && (this.currentSection.text === "placeholders" ||
                    this.currentSection.text === "properties")) {
                    /**
                     * Return Setting instead of undefined because SectionStack.getSectionSettings(),
                     * which is used in checkUrlPlaceholders(), returns Setting[] instead of Map<string, any>
                     */
                    setting = new setting_1.Setting(new defaultSetting_1.DefaultSetting());
                    Object.assign(setting, { name: settingName, section: this.currentSection.text });
                    return setting;
                }
                const message = messageUtil_1.unknownToken(settingName);
                this.result.push(util_1.createDiagnostic(this.createRange(this.match[1].length, settingName.length), message));
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
        handleCsv() {
            const line = this.config.getCurrentLine();
            let header = null;
            if (CSV_INLINE_HEADER_PATTERN.exec(line)) {
                let j = this.config.currentLineNumber + 1;
                header = this.config.getLine(j);
                while (header !== null && BLANK_LINE_PATTERN.test(header)) {
                    header = this.config.getLine(++j);
                }
            }
            else {
                let match = CSV_NEXT_LINE_HEADER_PATTERN.exec(line) || CSV_FROM_URL_PATTERN.exec(line);
                if (match !== null) {
                    this.match = match;
                    header = line.substring(this.match.index + 1);
                }
                else {
                    this.result.push(util_1.createDiagnostic(this.foundKeyword.range, messageUtil_1.getCsvErrorMessage(line)));
                }
            }
            this.addToStringMap(this.variables, "csvNames");
            this.csvColumns = (header === null) ? 0 : util_1.countCsvColumns(header);
        }
        /**
         * Creates a diagnostic if `else` is found, but `if` is not
         * or `if` is not the last keyword
         */
        handleElse() {
            if (this.foundKeyword === undefined) {
                throw new Error(`We're trying to handle 'else ', but foundKeyword is ${this.foundKeyword}`);
            }
            this.setLastCondition();
            let message;
            if (!this.areWeIn("if")) {
                message = messageUtil_1.noMatching(this.foundKeyword.text, "if");
            }
            else if (this.getLastKeyword() !== "if") {
                message = `${this.foundKeyword.text} has started before ${this.getLastKeyword()} has finished`;
            }
            if (message !== undefined) {
                this.result.push(util_1.createDiagnostic(this.foundKeyword.range, message));
            }
        }
        /**
         * Removes the variable from the last `for`
         */
        handleEndFor() {
            let forVariables = this.variables.get("forVariables");
            if (forVariables === undefined) {
                forVariables = [];
            }
            else {
                forVariables.pop();
            }
            this.variables.set("forVariables", forVariables);
        }
        /**
         * Creates diagnostics related to `for ... in _here_` statements
         * Like "for srv in servers", but "servers" is not defined
         * Also adds the new `for` variable to the corresponding map
         */
        handleFor() {
            const line = this.config.getCurrentLine();
            // groups are used in addToStringMap
            this.match = /(^\s*for\s+)(\w+)\s+in\s*/m.exec(line);
            if (this.match != null) {
                const collection = line.substring(this.match[0].length).trim();
                if (collection !== "") {
                    const regs = [
                        /^Object\.keys\((\w+)(?:\.\w+)*\)$/i,
                        /^(\w+)\.values\((["'])\w+\2\)$/i,
                        /^(\w+)(\[\d+\])*$/i // apps, apps[1]
                    ];
                    let varName;
                    for (const regex of regs) {
                        const matched = regex.exec(collection);
                        varName = matched ? matched[1] : null;
                        if (varName) {
                            break;
                        }
                    }
                    if (!varName) {
                        try {
                            /**
                             * Check for inline declaration, for example:
                             * for widgetType in ['chart', 'calendar']
                             */
                            Function(`return ${collection}`);
                        }
                        catch (err) {
                            const start = line.indexOf(collection);
                            this.result.push(util_1.createDiagnostic(this.createRange(start, collection.length), "Incorrect collection declaration."));
                        }
                    }
                    else if (!util_1.isInMap(varName, this.variables)) {
                        const message = messageUtil_1.unknownToken(varName);
                        const start = line.lastIndexOf(varName);
                        this.result.push(util_1.createDiagnostic(this.createRange(start, varName.length), message));
                    }
                }
                else {
                    const start = this.match[0].indexOf("in");
                    this.result.push(util_1.createDiagnostic(this.createRange(start, "in".length), "Empty 'in' statement"));
                }
                this.addToStringMap(this.variables, "forVariables");
            }
        }
        /**
         * Adds new variable to corresponding map,
         * Pushes a new keyword to the keyword stack
         * If necessary (`list hello = value1, value2` should not be closed)
         */
        handleList() {
            if (this.foundKeyword === undefined) {
                throw new Error(`We're trying to handle 'list', but foundKeyword is undefined`);
            }
            const line = this.config.getCurrentLine();
            this.match = /(^\s*list\s+)(\w+)\s*=/.exec(line);
            this.addToStringMap(this.variables, "listNames");
            if (/(=|,)[ \t]*$/m.test(line)) {
                this.keywordsStack.push(this.foundKeyword);
            }
            else {
                let j = this.config.currentLineNumber + 1;
                let nextLine = this.config.getLine(j);
                while (nextLine !== null && /^[ \t]*$/m.test(nextLine)) {
                    nextLine = this.config.getLine(++j);
                }
                if (nextLine !== null && (/^[ \t]*,/.test(nextLine) || /\bendlist\b/.test(nextLine))) {
                    this.keywordsStack.push(this.foundKeyword);
                }
            }
        }
        /**
         * Performs required operations after a section has finished.
         * Mostly empties arrays.
         */
        handleSection() {
            if (this.match == null) {
                if (this.previousSection !== undefined) {
                    this.currentSection = this.previousSection;
                    this.currentSettings = this.previousSettings;
                }
                return;
            }
            const [, indent, name] = this.match;
            const nextIsTags = this.currentSection && /tag/i.test(name);
            if (!nextIsTags) {
                /**
                 * If the next is [tags], no need to perform checks for current section now,
                 * they will be done after [tags] section finished.
                 */
                this.checkRequredSettingsForSection();
                this.addCurrentToParentSettings();
                if (/widget/i.test(name)) {
                    this.checkAliases();
                    this.deAliases.splice(0, this.deAliases.length);
                    this.aliases.splice(0, this.aliases.length);
                    this.settingValues.clear();
                }
                this.checkUrlPlaceholders();
                this.ifSettings.clear();
            }
            this.previousSettings = this.currentSettings.splice(0, this.currentSettings.length);
            this.previousSection = this.currentSection;
            this.currentSection = new textRange_1.TextRange(name, this.createRange(indent.length, name.length));
            this.parentSettings.delete(this.currentSection.text);
            this.setSectionToStackAndTree(this.currentSection);
        }
        /**
         * Attempts to add section to section stack, displays error if section
         * is out ouf hierarchy, unknown or has unresolved section dependencies
         * If section is null, finalizes section stack and return summary error
         * Adds last section of stack to ConfigTree.
         * @param section section to add or null
         */
        setSectionToStackAndTree(section) {
            let sectionStackError;
            const lastSection = this.sectionStack.getLastSection();
            if (lastSection) {
                this.configTree.addSection(lastSection.range, lastSection.settings);
            }
            if (section == null) {
                sectionStackError = this.sectionStack.finalize();
            }
            else {
                sectionStackError = this.sectionStack.insertSection(this.currentSection);
            }
            if (sectionStackError) {
                this.result.push(sectionStackError);
            }
        }
        /**
         * Calls functions in proper order to handle a found setting
         */
        handleSettings() {
            if (this.match == null) {
                return;
            }
            const line = this.config.getCurrentLine();
            if (this.currentSection === undefined || !/(?:tag|key)s?/.test(this.currentSection.text)) {
                this.handleRegularSetting();
            }
            else if (/(?:tag|key)s?/.test(this.currentSection.text) &&
                // We are in tags/keys section
                /(^[ \t]*)([a-z].*?[a-z])[ \t]*=/.test(line)) {
                this.match = /(^[ \t]*)([a-z].*?[a-z])[ \t]*=/.exec(line);
                if (this.match === null) {
                    return;
                }
                const [, indent, name] = this.match;
                const setting = this.getSetting(name);
                if (this.isAllowedWidget(setting)) {
                    this.result.push(util_1.createDiagnostic(this.createRange(indent.length, name.length), messageUtil_1.settingNameInTags(name), vscode_languageserver_types_1.DiagnosticSeverity.Information));
                }
            }
        }
        /**
         * Checks whether the setting is defined and is allowed to be defined in the current widget
         * @param setting the setting to be checked
         */
        isAllowedWidget(setting) {
            return setting !== undefined
                && this.currentSection.text !== "tag"
                && (setting.widget == null
                    || this.currentWidget === undefined
                    || setting.widget === this.currentWidget);
        }
        /**
         * Return true if the setting is allowed to be defined in the current section.
         * @param setting The setting to be checked.
         */
        isAllowedInSection(setting) {
            if (setting.section == null || this.currentSection == null) {
                return true;
            }
            const currDepth = resources_1.sectionDepthMap[this.currentSection.text];
            if (setting.name === "mode") {
                if (this.currentWidget == null) {
                    return true;
                }
                if (this.currentWidget === "chart") {
                    if (setting.value === "column-stack") {
                        return currDepth <= resources_1.sectionDepthMap.widget;
                    }
                    return currDepth <= resources_1.sectionDepthMap.series;
                }
            }
            if (Array.isArray(setting.section)) {
                return setting.section.some(s => currDepth <= resources_1.sectionDepthMap[s]);
            }
            else {
                const reqDepth = resources_1.sectionDepthMap[setting.section];
                return currDepth <= reqDepth;
            }
        }
        /**
         * Processes a regular setting which is defined not in tags/keys section
         */
        handleRegularSetting() {
            const line = this.config.getCurrentLine();
            const setting = this.getSettingCheck();
            if (setting === undefined) {
                return;
            }
            this.addSettingValue(setting);
            /**
             * Show hint if setting is deprecated
             */
            if (setting.deprecated) {
                this.result.push(util_1.createDiagnostic(setting.textRange, setting.deprecated, vscode_languageserver_types_1.DiagnosticSeverity.Warning));
            }
            if (!this.isAllowedInSection(setting)) {
                this.result.push(util_1.createDiagnostic(setting.textRange, messageUtil_1.illegalSetting(setting.displayName), vscode_languageserver_types_1.DiagnosticSeverity.Error));
            }
            if (setting.name === "type") {
                this.currentWidget = this.match[3];
                let reqs = resources_1.widgetRequirementsByType.get(this.currentWidget);
                if (reqs && reqs.sections) {
                    this.sectionStack.setSectionRequirements("widget", reqs.sections);
                }
            }
            if (!setting.multiLine) {
                this.checkRepetition(setting);
            }
            else {
                this.currentSettings.push(setting);
                this.sectionStack.insertCurrentSetting(setting);
            }
            if (!(this.currentSection && ["placeholders", "properties", "property"].includes(this.currentSection.text))) {
                this.typeCheck(setting);
                this.checkExcludes(setting);
                // Aliases
                if (setting.name === "alias") {
                    this.match = /(^\s*alias\s*=\s*)(\S+)\s*$/m.exec(line);
                    this.addToStringArray(this.aliases);
                }
                this.findDeAliases();
            }
        }
        /**
         * Check if settings or tag key contains whitespace and warn about it.
         * Ignore any settings in [properties] section.
         */
        checkSettingsWhitespaces() {
            const line = this.config.getCurrentLine();
            const match = /(^\s*)((\w+\s+)+\w+)\s*=\s*(.+?)\s*$/.exec(line);
            if (match != null && match[2]) {
                const settingName = match[2];
                if (settingName && !this.foundKeyword && /^\w+(\s.*\w)+$/.test(settingName)) {
                    const start = line.indexOf(settingName);
                    const range = this.createRange(start, settingName.length);
                    if (this.currentSection.text === "tags") {
                        if (!/^["].+["]$/.test(settingName)) {
                            this.result.push(util_1.createDiagnostic(range, messageUtil_1.tagNameWithWhitespaces(settingName), vscode_languageserver_types_1.DiagnosticSeverity.Warning));
                        }
                    }
                    else if (this.currentSection.text !== "properties") {
                        this.result.push(util_1.createDiagnostic(range, messageUtil_1.settingsWithWhitespaces(settingName), vscode_languageserver_types_1.DiagnosticSeverity.Warning));
                    }
                }
            }
        }
        /**
         * Updates the lastCondition field
         */
        setLastCondition() {
            this.lastCondition = `${this.config.currentLineNumber}${this.config.getCurrentLine()}`;
        }
        /**
         * Checks spelling mistakes in a section name
         */
        spellingCheck() {
            if (this.match == null) {
                return;
            }
            const indent = this.match[1].length;
            const word = this.match[2];
            const range = this.createRange(indent, word.length);
            if (word === "tag") {
                this.result.push(util_1.createDiagnostic(range, messageUtil_1.deprecatedTagSection, vscode_languageserver_types_1.DiagnosticSeverity.Warning));
            }
        }
        /**
         * Calls corresponding functions for the found keyword
         */
        switchKeyword() {
            if (this.foundKeyword === undefined) {
                throw new Error(`We're trying to handle a keyword, but foundKeyword is undefined`);
            }
            const line = this.config.getCurrentLine();
            switch (this.foundKeyword.text) {
                case "endfor":
                    this.handleEndFor();
                case "endif":
                    this.lastEndIf = this.config.currentLineNumber;
                case "endvar":
                case "endcsv":
                case "endlist":
                case "endsql":
                case "endscript": {
                    const expectedEnd = this.foundKeyword.text.substring("end".length);
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
                    const openBrackets = line.match(/((\s*[\[\{\(]\s*)+)/g);
                    const closeBrackets = line.match(/((\s*[\]\}\)]\s*)+)/g);
                    if (openBrackets) {
                        if (closeBrackets && openBrackets.map((s) => s.trim()).join("").length !==
                            closeBrackets.map((s) => s.trim()).join("").length
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
                    const regex = /!=|==/;
                    if (!regex.test(line)) {
                        this.result.push(util_1.createDiagnostic(this.foundKeyword.range, `Specify == or !=`));
                    }
                    this.setLastCondition();
                    break;
                }
                case "script": {
                    this.keywordHandler.handleScript(line, this.foundKeyword);
                    break;
                }
                case "sql": {
                    this.keywordHandler.handleSql(line, this.foundKeyword);
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
        typeCheck(setting) {
            if (this.match == null) {
                return;
            }
            const range = this.createRange(this.match[1].length, this.match[2].length);
            const diagnostic = setting.checkType(range);
            if (diagnostic != null) {
                this.result.push(diagnostic);
            }
        }
        /**
         * Creates diagnostics for a CSV line containing wrong columns number
         */
        validateCsv() {
            const line = this.config.getCurrentLine();
            const columns = util_1.countCsvColumns(line);
            if (columns !== this.csvColumns && !/^[ \t]*$/m.test(line)) {
                this.result.push(util_1.createDiagnostic(this.createRange(0, line.length), `Expected ${this.csvColumns} columns, but found ${columns}`));
            }
        }
        /**
         * Creates diagnostics for unknown variables in `for` keyword
         * like `for srv in servers setting = @{server} endfor`
         * but `server` is undefined
         */
        validateFor() {
            const line = this.config.getCurrentLine();
            const atRegexp = /@{.+?}/g;
            this.match = atRegexp.exec(line);
            while (this.match !== null) {
                const substr = this.match[0];
                const startPosition = this.match.index;
                const varRegexp = /[a-zA-Z_]\w*(?!\w*["\('])/g;
                this.match = varRegexp.exec(substr);
                while (this.match !== null) {
                    if (substr.charAt(this.match.index - 1) === ".") {
                        this.match = varRegexp.exec(substr);
                        continue;
                    }
                    const variable = this.match[0];
                    if (!util_1.isInMap(variable, this.variables)) {
                        const position = startPosition + this.match.index;
                        const message = messageUtil_1.unknownToken(variable);
                        this.result.push(util_1.createDiagnostic(this.createRange(position, variable.length), message));
                    }
                    this.match = varRegexp.exec(substr);
                }
                this.match = atRegexp.exec(line);
            }
        }
        getSetting(name) {
            const line = this.config.getCurrentLine();
            const start = line.indexOf(name);
            const range = (start > -1) ? this.createRange(start, name.length) : undefined;
            return util_1.getSetting(name, range);
        }
        checkUrlPlaceholders() {
            let phs = this.getUrlPlaceholders();
            if (phs.length > 0) {
                if (this.currentSection && this.currentSection.text.match(/widget/i)) {
                    this.sectionStack.requireSections("widget", "placeholders");
                }
            }
            let placeholderRange = this.sectionStack.getSectionRange("placeholders");
            if (placeholderRange) {
                let phSectionSettings = this.sectionStack.getSectionSettings("placeholders", false);
                let missingPhs = phs.filter(key => {
                    const cleared = setting_1.Setting.clearValue(key);
                    return phSectionSettings.find(s => s.name === cleared) == null;
                });
                if (missingPhs.length > 0) {
                    this.result.push(util_1.createDiagnostic(placeholderRange.range, `Missing placeholders: ${missingPhs.join(", ")}.`, vscode_languageserver_types_1.DiagnosticSeverity.Error));
                }
                let unnecessaryPhs = phSectionSettings.filter(s => !phs.includes(s.name)).map(s => s.name);
                if (unnecessaryPhs.length > 0) {
                    this.result.push(util_1.createDiagnostic(placeholderRange.range, `Unnecessary placeholders: ${unnecessaryPhs.join(", ")}.`, vscode_languageserver_types_1.DiagnosticSeverity.Warning));
                }
            }
        }
        /**
         * Returns all placeholders declared before the current line.
         */
        getUrlPlaceholders() {
            let result = new Set();
            for (let setting of placeholderContainingSettings) {
                let currentSetting = this.sectionStack.getCurrentSetting(setting);
                if (currentSetting) {
                    const regexp = /{(.+?)}/g;
                    let match = regexp.exec(currentSetting.value);
                    while (match !== null) {
                        const cleared = setting_1.Setting.clearSetting(match[1]);
                        result.add(cleared);
                        match = regexp.exec(currentSetting.value);
                    }
                }
            }
            // @ts-ignore
            return [...result];
        }
        /**
         * Creates Range object for the current line.
         *
         * @param start - The starting position in the string
         * @param length - Length of the word to be highlighted
         * @returns Range object with start equal to `start` and end equal to `start+length`
         */
        createRange(start, length) {
            return util_1.createRange(start, length, this.config.currentLineNumber);
        }
    }
    exports.Validator = Validator;
});
