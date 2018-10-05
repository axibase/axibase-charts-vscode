import {
    CompletionItem, CompletionItemKind, InsertTextFormat, Position, TextDocument,
} from "vscode-languageserver";
import { deleteComments, deleteScripts, getSetting } from "./util";
import { Setting } from "./setting";
import { Field } from "./field";
const snippets = require('../../snippets/snippets.json');

/**
 * Provides dynamic completion items.
 */
export class CompletionProvider {
    private readonly text: string;
    private readonly currentLine: string;

    public constructor(textDocument: TextDocument, position: Position) {
        const text: string = textDocument.getText().substr(0, textDocument.offsetAt(position));
        this.text = deleteScripts(deleteComments(text));
        this.currentLine = this.text.split('\n')[position.line];
    }

    /**
     * Creates completion items
     */
    public getCompletionItems(): CompletionItem[] {
        let match = /^\s*(\S+)\s*=\s*/.exec(this.currentLine);
        if (match) {
            // completion requested at assign stage, i. e. type = <Ctrl + space>
            return this.completeSetting(match[1]);
        } else {
            // completion requested at start of line (supposed that line is empty)
            return this.completeSnippets().concat(this.completeIf(), this.completeFor());
        }
    }

    /**
     * Creates a completion item containing `for` loop.
     * `in` statement is generated based on previously declared lists and vars if any.
     * Variable name is generated based on `in` statement.
     * @returns completion item
     */
    private completeFor(): CompletionItem {
        const regexp: RegExp = /^[ \t]*(?:list|var)[ \t]+(\S+)[ \t]*=/mg;
        let match: RegExpExecArray | null = regexp.exec(this.text);
        let lastMatch: RegExpExecArray | undefined;

        while (match) {
            lastMatch = match;
            match = regexp.exec(this.text);
        }

        let collection: string = "collection";
        let item: string = "item";

        if (lastMatch) {
            collection = lastMatch[1];
            if (collection.endsWith("s")) {
                item = collection.substr(0, collection.lastIndexOf("s"));
            }
        }
        const completion: CompletionItem = CompletionItem.create("for");
        completion.insertText = `
for \${1:${item}} in \${2:${collection}}
  \${3:entity = @{\${1:${item}}}}
  \${0}
endfor`;
        completion.detail = "For loop";
        completion.kind = CompletionItemKind.Keyword;
        completion.insertTextFormat = InsertTextFormat.Snippet;

        return completion;
    }

    /**
     * Creates an array of completion items containing `if` statement.
     * Conditions are generated based on previously declared `for` loops.
     * @returns array containing variants of `if` statement
     */
    private completeIf(): CompletionItem[] {
        const regexp: RegExp = /^[ \t]*for[ \t]+(\w+)[ \t]+in/img;
        const endFor: RegExp = /^[ \t]*endfor/img;
        let match: RegExpExecArray | null = regexp.exec(this.text);
        let lastMatch: RegExpExecArray | undefined;

        while (match) {
            const end: RegExpExecArray | null = endFor.exec(this.text);
            if (!end || end.index < match.index) {
                lastMatch = match;
            }
            match = regexp.exec(this.text);
        }

        let item: string = "item";

        if (lastMatch) {
            item = lastMatch[1];
        }
        const ifString: CompletionItem = CompletionItem.create("if string");
        ifString.detail = "if item equals text";
        ifString.insertText = `
if @{\${1:${item}}} \${2:==} \${3:"item1"}
  \${4:entity} = \${5:"item2"}
else
  \${4:entity} = \${6:"item3"}
endif
\${0}`;

        const ifNumber: CompletionItem = CompletionItem.create("if number");
        ifNumber.insertText = `
if @{\${1:${item}}} \${2:==} \${3:5}
  \${4:entity} = \${5:"item1"}
else
  \${4:entity} = \${6:"item2"}
endif
\${0}`;
        ifNumber.detail = "if item equals number";

        const ifElseIf: CompletionItem = CompletionItem.create("if else if");
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

        return [ifString, ifNumber, ifElseIf].map((completion: CompletionItem): CompletionItem => {
            completion.insertTextFormat = InsertTextFormat.Snippet;
            completion.kind = CompletionItemKind.Keyword;

            return completion;
        });
    }

    /**
     * Creates an array of completion items containing possible values for settings.
     * @param settingName name of the setting, for example "colors"
     * @returns array containing completions
     */
    private completeSetting(settingName: string): CompletionItem[] {
        let setting = getSetting(settingName);
        if (!setting) {
            return [];
        }
        switch (setting.type) {
            case "string": {
                return this.completeStringSetting(setting);
            }
            case "number":
            case "integer":
                if (setting.example) {
                    return [this.fillCompletionItem(setting.example.toString())];
                }
                break;
            case "boolean": {
                return this.getItemsArray(["true", "false"]);
            }
            case "enum": {
                return this.getItemsArray(setting.enum);
            }
            case "interval": {
                return this.getItemsArray(Setting.intervalUnits);
            }
            case "date": {
                return this.getItemsArray(Setting.calendarKeywords, new Date().toISOString());
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
    private completeSnippets(): CompletionItem[] {
        let items: CompletionItem[] = Object.keys(snippets).map(key => {
            let insertText: string = (typeof snippets[key].body === 'string') ? snippets[key].body : snippets[key].body.join("\n");
            return this.fillCompletionItem(insertText, snippets[key].description, key);
        });
        return items;
    }

    /**
     * Creates an array of completion items containing possible values for settings with type = "string".
     * @param setting the setting
     * @returns array containing completions
     */
    private completeStringSetting(setting: Setting): CompletionItem[] {
                let valueItems: CompletionItem[] = [];
                let scriptItems: CompletionItem[] = [];
                if (setting.possibleValues) {
                    valueItems = setting.possibleValues.map(v => {
                        return this.fillCompletionItem(v.value, v.detail);
                    });
                }
                if (setting.script) {
                    setting.script.fields.forEach(field => {
                        if (field.type === "function") {
                            if (field.args) {
                                let requiredArgs: Field[] = field.args.filter(a => a.required);
                                let optionalArgs: Field[] = field.args.filter(a => !a.required);
                                let requiredArgsString: string = `${requiredArgs.map(field => field.name).join(", ")}`;
                                scriptItems.push(this.fillCompletionItem(`${field.name}(${requiredArgsString})`));
                                let args: string = "";
                                for (let arg of optionalArgs) {
                                    args = `${args !== "" ? args + ", " : ""}${arg.name}`;
                                    scriptItems.push(this.fillCompletionItem(`${field.name}(${requiredArgsString !== "" ?
                                        requiredArgsString + ", " : ""}${args})`));
                                }
                            } else {
                                scriptItems.push(this.fillCompletionItem(`${field.name}()`));
                            }
                        } else {
                            scriptItems.push(this.fillCompletionItem(`${field.name}`, `Type: ${field.type}`));
                        }
                    });
                }
        if (!setting.possibleValues && setting.example !== "") {
                    valueItems = [this.fillCompletionItem(setting.example.toString())]
                }
                return valueItems.concat(scriptItems);
            }

    /**
     * Set fields for CompletionItem
     * @param insertText text to be inserted with completion request     * 
     * @returns completion
     */
    private fillCompletionItem(insertText: string, detailText?: string, name?: string): CompletionItem {
        let item: CompletionItem = CompletionItem.create(name || insertText);
            item.insertTextFormat = InsertTextFormat.Snippet;
            item.kind = CompletionItemKind.Keyword;
        item.insertText = insertText;
        item.detail = detailText || insertText;
        return item;
    }

    /**
     * Сonverts the source array to of completions
     * @param processedArray the source array
     * @param additionalStrings the strings to be processed and added to completions
     * @returns completions
     */
    private getItemsArray(processedArray: string[], ...additionalStrings: string[]): CompletionItem[] {
        let items: CompletionItem[] = processedArray.map(el => {
            return this.fillCompletionItem(el);
        });
        for (let s of additionalStrings) {
            items.push(this.fillCompletionItem(s));
        }
        return items;
    }

}
