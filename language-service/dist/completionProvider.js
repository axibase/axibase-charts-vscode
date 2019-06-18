var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "vscode-languageserver-types", "./setting", "./util"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var vscode_languageserver_types_1 = require("vscode-languageserver-types");
    var setting_1 = require("./setting");
    var util_1 = require("./util");
    /**
     * Provides dynamic completion items.
     */
    var CompletionProvider = /** @class */ (function () {
        function CompletionProvider(textDocument, position, resourcesProvider) {
            var text = textDocument.getText().substr(0, textDocument.offsetAt(position));
            this.text = util_1.Util.deleteScripts(util_1.Util.deleteComments(text));
            var textList = this.text.split("\n");
            this.currentLine = textList[textList.length - 1];
            this.resourcesProvider = resourcesProvider;
        }
        /**
         * Creates completion items
         */
        CompletionProvider.prototype.getCompletionItems = function () {
            var match = /^\s*(\S+)\s*=\s*/.exec(this.currentLine);
            if (match) {
                // completion requested at assign stage, i. e. type = <Ctrl + space>
                return this.completeSettingValue(match[1]);
            }
            else {
                // completion requested at start of line (supposed that line is empty)
                return this.completeSnippets().concat(this.completeIf(), this.completeFor(), this.completeSettingName());
            }
        };
        /**
         * Creates a completion item containing `for` loop.
         * `in` statement is generated based on previously declared lists and vars if any.
         * Variable name is generated based on `in` statement.
         * @returns completion item
         */
        CompletionProvider.prototype.completeFor = function () {
            var regexp = /^[ \t]*(?:list|var)[ \t]+(\S+)[ \t]*=/mg;
            var match = regexp.exec(this.text);
            var lastMatch;
            while (match) {
                lastMatch = match;
                match = regexp.exec(this.text);
            }
            var collection = "collection";
            var item = "item";
            if (lastMatch) {
                collection = lastMatch[1];
                if (collection.endsWith("s")) {
                    item = collection.substr(0, collection.lastIndexOf("s"));
                }
            }
            var completion = vscode_languageserver_types_1.CompletionItem.create("for");
            completion.insertText = "\nfor ${1:" + item + "} in ${2:" + collection + "}\n  ${3:entity = @{${1:" + item + "}}}\n  ${0}\nendfor";
            completion.detail = "For loop";
            completion.kind = vscode_languageserver_types_1.CompletionItemKind.Keyword;
            completion.insertTextFormat = vscode_languageserver_types_1.InsertTextFormat.Snippet;
            return completion;
        };
        /**
         * Creates an array of completion items containing `if` statement.
         * Conditions are generated based on previously declared `for` loops.
         * @returns array containing variants of `if` statement
         */
        CompletionProvider.prototype.completeIf = function () {
            var regexp = /^[ \t]*for[ \t]+(\w+)[ \t]+in/img;
            var endFor = /^[ \t]*endfor/img;
            var match = regexp.exec(this.text);
            var lastMatch;
            while (match) {
                var end = endFor.exec(this.text);
                if (!end || end.index < match.index) {
                    lastMatch = match;
                }
                match = regexp.exec(this.text);
            }
            var item = "item";
            if (lastMatch) {
                item = lastMatch[1];
            }
            var ifString = vscode_languageserver_types_1.CompletionItem.create("if string");
            ifString.detail = "if item equals text";
            ifString.insertText = "\nif @{${1:" + item + "}} ${2:==} ${3:\"item1\"}\n  ${4:entity} = ${5:\"item2\"}\nelse\n  ${4:entity} = ${6:\"item3\"}\nendif\n${0}";
            var ifNumber = vscode_languageserver_types_1.CompletionItem.create("if number");
            ifNumber.insertText = "\nif @{${1:" + item + "}} ${2:==} ${3:5}\n  ${4:entity} = ${5:\"item1\"}\nelse\n  ${4:entity} = ${6:\"item2\"}\nendif\n${0}";
            ifNumber.detail = "if item equals number";
            var ifElseIf = vscode_languageserver_types_1.CompletionItem.create("if else if");
            ifElseIf.detail = "if item equals number else if";
            ifElseIf.insertText = "\nif @{${1:" + item + "}} ${2:==} ${3:5}\n  ${4:entity} = ${5:\"item1\"}\nelseif @{${1:" + item + "}} ${6:==} ${7:6}\n  ${4:entity} = ${8:\"item2\"}\nelse\n  ${4:entity} = ${9:\"item3\"}\nendif\n${0}";
            return [ifString, ifNumber, ifElseIf].map(function (completion) {
                completion.insertTextFormat = vscode_languageserver_types_1.InsertTextFormat.Snippet;
                completion.kind = vscode_languageserver_types_1.CompletionItemKind.Snippet;
                return completion;
            });
        };
        /**
         * Creates an array of completion items containing setting names.
         * @returns array containing snippets
         */
        CompletionProvider.prototype.completeSettingName = function () {
            var e_1, _a;
            var items = [];
            try {
                for (var _b = __values(this.resourcesProvider.settingsMap), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), value = _d[1];
                    items.push(this.fillCompletionItem({
                        detail: (value.description ? value.description + "\n" : "") + "Example: " + value.example,
                        insertText: value.displayName + " = ",
                        kind: vscode_languageserver_types_1.CompletionItemKind.Field,
                        name: value.displayName
                    }));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return items;
        };
        /**
         * Creates an array of completion items containing possible values for settings.
         * @param settingName name of the setting, for example "colors"
         * @returns array containing completions
         */
        CompletionProvider.prototype.completeSettingValue = function (settingName) {
            var setting = this.resourcesProvider.getSetting(settingName);
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
                    return this.getItemsArray(setting.enum.map(function (el) {
                        return el.replace(/percentile\\.+/, "percentile(n)");
                    }));
                }
                case "interval": {
                    return this.getItemsArray.apply(this, __spread([setting_1.intervalUnits], setting.enum));
                }
                case "date": {
                    return this.getItemsArray(setting_1.calendarKeywords, new Date().toISOString());
                }
                default: {
                    return [];
                }
            }
            return [];
        };
        /**
         * Creates an array of completion items containing snippets.
         * @returns array containing snippets
         */
        CompletionProvider.prototype.completeSnippets = function () {
            // const items: CompletionItem[] = Object.keys(snippets).map((key: string) => {
            //     const insertText: string =
            //         (typeof snippets[key].body === "string") ? snippets[key].body : snippets[key].body.join("\n");
            //     return this.fillCompletionItem({
            //         insertText, detail: snippets[key].description,
            //         name: key, insertTextFormat:
            //             InsertTextFormat.Snippet, kind: CompletionItemKind.Keyword
            //     });
            // });
            return [];
            // return items;
        };
        /**
         * Creates an array of completion items containing possible values for settings with type = "string".
         * @param setting the setting
         * @returns array containing completions
         */
        CompletionProvider.prototype.completeStringSettingValue = function (setting) {
            var _this = this;
            var valueItems = [];
            var scriptItems = [];
            if (setting.possibleValues) {
                valueItems = setting.possibleValues.map(function (v) {
                    return _this.fillCompletionItem({ insertText: v.value, detail: v.detail });
                });
            }
            if (setting.script) {
                setting.script.fields.forEach(function (field) {
                    var e_2, _a;
                    if (field.type === "function") {
                        var itemFields = { insertText: "", kind: vscode_languageserver_types_1.CompletionItemKind.Function };
                        if (field.args) {
                            var requiredArgs = field.args.filter(function (a) { return a.required; });
                            var optionalArgs = field.args.filter(function (a) { return !a.required; });
                            var requiredArgsString = "" + requiredArgs.map(function (field) { return field.name; }).join(", ");
                            itemFields.insertText = "" + field.name + (requiredArgsString !== "" ?
                                "(" + requiredArgsString + ")" : "");
                            scriptItems.push(_this.fillCompletionItem(itemFields));
                            var args = "";
                            try {
                                for (var optionalArgs_1 = __values(optionalArgs), optionalArgs_1_1 = optionalArgs_1.next(); !optionalArgs_1_1.done; optionalArgs_1_1 = optionalArgs_1.next()) {
                                    var arg = optionalArgs_1_1.value;
                                    args = "" + (args !== "" ? args + ", " : "") + arg.name;
                                    itemFields.insertText = field.name + "(" + (requiredArgsString !== "" ?
                                        requiredArgsString + ", " : "") + args + ")";
                                    scriptItems.push(_this.fillCompletionItem(itemFields));
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (optionalArgs_1_1 && !optionalArgs_1_1.done && (_a = optionalArgs_1.return)) _a.call(optionalArgs_1);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                        }
                        else {
                            itemFields.insertText = field.name;
                            scriptItems.push(_this.fillCompletionItem(itemFields));
                        }
                    }
                    else {
                        scriptItems.push(_this.fillCompletionItem({
                            insertText: field.name,
                            detail: "Type: " + field.type
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
        };
        /**
         * Set fields for CompletionItem
         * @param insertText text to be inserted with completion request
         * @returns completion
         */
        CompletionProvider.prototype.fillCompletionItem = function (itemFields) {
            var item = vscode_languageserver_types_1.CompletionItem.create(itemFields.name || itemFields.insertText);
            item.insertTextFormat = itemFields.insertTextFormat || vscode_languageserver_types_1.InsertTextFormat.PlainText;
            item.kind = itemFields.kind || vscode_languageserver_types_1.CompletionItemKind.Value;
            item.insertText = itemFields.insertText;
            item.detail = itemFields.detail || itemFields.insertText;
            item.sortText = item.kind.toString();
            return item;
        };
        /**
         * Сonverts the source array to array of completions
         * @param processedArray the source array
         * @param additionalStrings the strings to be processed and added to completions
         * @returns completions
         */
        CompletionProvider.prototype.getItemsArray = function (processedArray) {
            var e_3, _a;
            var _this = this;
            var additionalStrings = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                additionalStrings[_i - 1] = arguments[_i];
            }
            var items = processedArray.map(function (el) { return _this.fillCompletionItem({ insertText: el }); });
            try {
                for (var additionalStrings_1 = __values(additionalStrings), additionalStrings_1_1 = additionalStrings_1.next(); !additionalStrings_1_1.done; additionalStrings_1_1 = additionalStrings_1.next()) {
                    var s = additionalStrings_1_1.value;
                    items.push(this.fillCompletionItem({ insertText: s }));
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (additionalStrings_1_1 && !additionalStrings_1_1.done && (_a = additionalStrings_1.return)) _a.call(additionalStrings_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return items;
        };
        return CompletionProvider;
    }());
    exports.CompletionProvider = CompletionProvider;
});
