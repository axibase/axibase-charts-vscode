import {
    CompletionItem, CompletionItemKind, InsertTextFormat, Position, TextDocument
} from "vscode-languageserver-types";
import { Field } from "./field";
import { calendarKeywords, intervalUnits, Setting } from "./setting";
import { Util } from "./util";
// export const snippets = require("../../snippets/snippets.json");

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
    private readonly text: string;
    private readonly currentLine: string;
    private readonly resourcesProvider: any;

    public constructor(textDocument: TextDocument, position: Position, resourcesProvider: any) {
        const text: string = textDocument.getText().substr(0, textDocument.offsetAt(position));
        this.text = Util.deleteScripts(Util.deleteComments(text));
        let textList = this.text.split("\n");
        this.currentLine = textList[textList.length - 1];
        this.resourcesProvider = resourcesProvider;
    }

    /**
     * Creates completion items
     */
    public getCompletionItems(): CompletionItem[] {
        let match = /^\s*(\S+)\s*=\s*/.exec(this.currentLine);
        if (match) {
            // completion requested at assign stage, i. e. type = <Ctrl + space>
            return this.completeSettingValue(match[1]);
        } else {
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
            completion.kind = CompletionItemKind.Snippet;

            return completion;
        });
    }

    /**
     * Creates an array of completion items containing setting names.
     * @returns array containing snippets
     */
    private completeSettingName(): CompletionItem[] {
        const items: CompletionItem[] = [];
        for (let [, value] of this.resourcesProvider.settingsMap) {
            items.push(this.fillCompletionItem({
                detail: `${value.description ? value.description + "\n" : ""}Example: ${value.example}`,
                insertText: `${value.displayName} = `,
                kind: CompletionItemKind.Field,
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
    private completeSettingValue(settingName: string): CompletionItem[] {
        const setting = this.resourcesProvider.getSetting(settingName);
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
                return this.getItemsArray(setting.enum.map(el =>
                    el.replace(/percentile\\.+/, "percentile(n)")));
            }
            case "interval": {
                return this.getItemsArray(intervalUnits, ...setting.enum);
            }
            case "date": {
                return this.getItemsArray(calendarKeywords, new Date().toISOString());
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
    }

    /**
     * Creates an array of completion items containing possible values for settings with type = "string".
     * @param setting the setting
     * @returns array containing completions
     */
    private completeStringSettingValue(setting: Setting): CompletionItem[] {
        let valueItems: CompletionItem[] = [];
        let scriptItems: CompletionItem[] = [];
        if (setting.possibleValues) {
            valueItems = setting.possibleValues.map(v =>
                this.fillCompletionItem({ insertText: v.value, detail: v.detail }));
        }
        if (setting.script) {
            setting.script.fields.forEach((field: Field) => {
                if (field.type === "function") {
                    let itemFields: ItemFields = { insertText: "", kind: CompletionItemKind.Function };
                    if (field.args) {
                        let requiredArgs: Field[] = field.args.filter(a => a.required);
                        let optionalArgs: Field[] = field.args.filter(a => !a.required);
                        let requiredArgsString: string = `${requiredArgs.map(field => field.name).join(", ")}`;
                        itemFields.insertText = `${field.name}${requiredArgsString !== "" ?
                            "(" + requiredArgsString + ")" : ""}`;
                        scriptItems.push(this.fillCompletionItem(itemFields));
                        let args: string = "";
                        for (let arg of optionalArgs) {
                            args = `${args !== "" ? args + ", " : ""}${arg.name}`;
                            itemFields.insertText = `${field.name}(${requiredArgsString !== "" ?
                                requiredArgsString + ", " : ""}${args})`;
                            scriptItems.push(this.fillCompletionItem(itemFields));
                        }
                    } else {
                        itemFields.insertText = field.name;
                        scriptItems.push(this.fillCompletionItem(itemFields));
                    }
                } else {
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
                kind: CompletionItemKind.Field
            })];
        }

        return valueItems.concat(scriptItems);
    }

    /**
     * Set fields for CompletionItem
     * @param insertText text to be inserted with completion request
     * @returns completion
     */
    private fillCompletionItem(itemFields: ItemFields): CompletionItem {
        let item: CompletionItem = CompletionItem.create(itemFields.name || itemFields.insertText);
        item.insertTextFormat = itemFields.insertTextFormat || InsertTextFormat.PlainText;
        item.kind = itemFields.kind || CompletionItemKind.Value;
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
    private getItemsArray(processedArray: string[], ...additionalStrings: string[]): CompletionItem[] {

        let items: CompletionItem[] = processedArray.map(el => this.fillCompletionItem({ insertText: el }));
        for (let s of additionalStrings) {
            items.push(this.fillCompletionItem({ insertText: s }));
        }

        return items;
    }

}
