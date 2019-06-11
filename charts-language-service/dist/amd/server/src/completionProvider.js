define(["require", "exports", "vscode-languageserver-types", "./resources", "./setting", "./util"], function (require, exports, vscode_languageserver_types_1, resources_1, setting_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.snippets = require("../../snippets/snippets.json");
    /**
     * Provides dynamic completion items.
     */
    class CompletionProvider {
        constructor(textDocument, position) {
            const text = textDocument.getText().substr(0, textDocument.offsetAt(position));
            this.text = util_1.deleteScripts(util_1.deleteComments(text));
            let textList = this.text.split("\n");
            this.currentLine = textList[textList.length - 1];
        }
        /**
         * Creates completion items
         */
        getCompletionItems() {
            let match = /^\s*(\S+)\s*=\s*/.exec(this.currentLine);
            if (match) {
                // completion requested at assign stage, i. e. type = <Ctrl + space>
                return this.completeSettingValue(match[1]);
            }
            else {
                // completion requested at start of line (supposed that line is empty)
                return this.completeSnippets().concat(this.completeIf(), this.completeFor(), this.completeSettingName());
            }
        }
        /**
         * Creates a completion item containing `for` loop.
         * `in` statement is generated based on previously declared lists and vars if any.
         * Variable name is generated based on `in` statement.
         * @returns completion item
         */
        completeFor() {
            const regexp = /^[ \t]*(?:list|var)[ \t]+(\S+)[ \t]*=/mg;
            let match = regexp.exec(this.text);
            let lastMatch;
            while (match) {
                lastMatch = match;
                match = regexp.exec(this.text);
            }
            let collection = "collection";
            let item = "item";
            if (lastMatch) {
                collection = lastMatch[1];
                if (collection.endsWith("s")) {
                    item = collection.substr(0, collection.lastIndexOf("s"));
                }
            }
            const completion = vscode_languageserver_types_1.CompletionItem.create("for");
            completion.insertText = `
for \${1:${item}} in \${2:${collection}}
  \${3:entity = @{\${1:${item}}}}
  \${0}
endfor`;
            completion.detail = "For loop";
            completion.kind = vscode_languageserver_types_1.CompletionItemKind.Keyword;
            completion.insertTextFormat = vscode_languageserver_types_1.InsertTextFormat.Snippet;
            return completion;
        }
        /**
         * Creates an array of completion items containing `if` statement.
         * Conditions are generated based on previously declared `for` loops.
         * @returns array containing variants of `if` statement
         */
        completeIf() {
            const regexp = /^[ \t]*for[ \t]+(\w+)[ \t]+in/img;
            const endFor = /^[ \t]*endfor/img;
            let match = regexp.exec(this.text);
            let lastMatch;
            while (match) {
                const end = endFor.exec(this.text);
                if (!end || end.index < match.index) {
                    lastMatch = match;
                }
                match = regexp.exec(this.text);
            }
            let item = "item";
            if (lastMatch) {
                item = lastMatch[1];
            }
            const ifString = vscode_languageserver_types_1.CompletionItem.create("if string");
            ifString.detail = "if item equals text";
            ifString.insertText = `
if @{\${1:${item}}} \${2:==} \${3:"item1"}
  \${4:entity} = \${5:"item2"}
else
  \${4:entity} = \${6:"item3"}
endif
\${0}`;
            const ifNumber = vscode_languageserver_types_1.CompletionItem.create("if number");
            ifNumber.insertText = `
if @{\${1:${item}}} \${2:==} \${3:5}
  \${4:entity} = \${5:"item1"}
else
  \${4:entity} = \${6:"item2"}
endif
\${0}`;
            ifNumber.detail = "if item equals number";
            const ifElseIf = vscode_languageserver_types_1.CompletionItem.create("if else if");
            ifElseIf.detail = "if item equals number else if";
            ifElseIf.insertText = `
if @{\${1:${item}}} \${2:==} \${3:5}
  \${4:entity} = \${5:"item1"}
elseif @{\${1:${item}}} \${6:==} \${7:6}
  \${4:entity} = \${8:"item2"}
else
  \${4:entity} = \${9:"item3"}
endif
\${0}`;
            return [ifString, ifNumber, ifElseIf].map((completion) => {
                completion.insertTextFormat = vscode_languageserver_types_1.InsertTextFormat.Snippet;
                completion.kind = vscode_languageserver_types_1.CompletionItemKind.Snippet;
                return completion;
            });
        }
        /**
         * Creates an array of completion items containing setting names.
         * @returns array containing snippets
         */
        completeSettingName() {
            const items = [];
            for (let [, value] of resources_1.settingsMap) {
                items.push(this.fillCompletionItem({
                    detail: `${value.description ? value.description + "\n" : ""}Example: ${value.example}`,
                    insertText: `${value.displayName} = `,
                    kind: vscode_languageserver_types_1.CompletionItemKind.Field,
                    name: value.displayName
                }));
            }
            return items;
        }
        /**
         * Creates an array of completion items containing possible values for settings.
         * @param settingName name of the setting, for example "colors"
         * @returns array containing completions
         */
        completeSettingValue(settingName) {
            const setting = util_1.getSetting(settingName);
            if (!setting) {
                return [];
            }
            switch (setting.type) {
                case "string": {
                    return this.completeStringSettingValue(setting);
                }
                case "number":
                case "integer":
                    if (setting.example) {
                        return [this.fillCompletionItem({ insertText: setting.example.toString() })];
                    }
                    break;
                case "boolean": {
                    return this.getItemsArray(["true", "false"]);
                }
                case "enum": {
                    return this.getItemsArray(setting.enum.map(el => el.replace(/percentile\\.+/, "percentile(n)")));
                }
                case "interval": {
                    return this.getItemsArray(setting_1.intervalUnits, ...setting.enum);
                }
                case "date": {
                    return this.getItemsArray(setting_1.calendarKeywords, new Date().toISOString());
                }
                default: {
                    return [];
                }
            }
            return [];
        }
        /**
         * Creates an array of completion items containing snippets.
         * @returns array containing snippets
         */
        completeSnippets() {
            const items = Object.keys(exports.snippets).map((key) => {
                const insertText = (typeof exports.snippets[key].body === "string") ? exports.snippets[key].body : exports.snippets[key].body.join("\n");
                return this.fillCompletionItem({
                    insertText, detail: exports.snippets[key].description,
                    name: key, insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet, kind: vscode_languageserver_types_1.CompletionItemKind.Keyword
                });
            });
            return items;
        }
        /**
         * Creates an array of completion items containing possible values for settings with type = "string".
         * @param setting the setting
         * @returns array containing completions
         */
        completeStringSettingValue(setting) {
            let valueItems = [];
            let scriptItems = [];
            if (setting.possibleValues) {
                valueItems = setting.possibleValues.map(v => this.fillCompletionItem({ insertText: v.value, detail: v.detail }));
            }
            if (setting.script) {
                setting.script.fields.forEach((field) => {
                    if (field.type === "function") {
                        let itemFields = { insertText: "", kind: vscode_languageserver_types_1.CompletionItemKind.Function };
                        if (field.args) {
                            let requiredArgs = field.args.filter(a => a.required);
                            let optionalArgs = field.args.filter(a => !a.required);
                            let requiredArgsString = `${requiredArgs.map(field => field.name).join(", ")}`;
                            itemFields.insertText = `${field.name}${requiredArgsString !== "" ?
                                "(" + requiredArgsString + ")" : ""}`;
                            scriptItems.push(this.fillCompletionItem(itemFields));
                            let args = "";
                            for (let arg of optionalArgs) {
                                args = `${args !== "" ? args + ", " : ""}${arg.name}`;
                                itemFields.insertText = `${field.name}(${requiredArgsString !== "" ?
                                    requiredArgsString + ", " : ""}${args})`;
                                scriptItems.push(this.fillCompletionItem(itemFields));
                            }
                        }
                        else {
                            itemFields.insertText = field.name;
                            scriptItems.push(this.fillCompletionItem(itemFields));
                        }
                    }
                    else {
                        scriptItems.push(this.fillCompletionItem({
                            insertText: field.name,
                            detail: `Type: ${field.type}`
                        }));
                    }
                });
            }
            if (!setting.possibleValues && setting.example !== "") {
                valueItems = [this.fillCompletionItem({
                        insertText: setting.example.toString(),
                        kind: vscode_languageserver_types_1.CompletionItemKind.Field
                    })];
            }
            return valueItems.concat(scriptItems);
        }
        /**
         * Set fields for CompletionItem
         * @param insertText text to be inserted with completion request
         * @returns completion
         */
        fillCompletionItem(itemFields) {
            let item = vscode_languageserver_types_1.CompletionItem.create(itemFields.name || itemFields.insertText);
            item.insertTextFormat = itemFields.insertTextFormat || vscode_languageserver_types_1.InsertTextFormat.PlainText;
            item.kind = itemFields.kind || vscode_languageserver_types_1.CompletionItemKind.Value;
            item.insertText = itemFields.insertText;
            item.detail = itemFields.detail || itemFields.insertText;
            item.sortText = item.kind.toString();
            return item;
        }
        /**
         * Сonverts the source array to array of completions
         * @param processedArray the source array
         * @param additionalStrings the strings to be processed and added to completions
         * @returns completions
         */
        getItemsArray(processedArray, ...additionalStrings) {
            let items = processedArray.map(el => this.fillCompletionItem({ insertText: el }));
            for (let s of additionalStrings) {
                items.push(this.fillCompletionItem({ insertText: s }));
            }
            return items;
        }
    }
    exports.CompletionProvider = CompletionProvider;
});
