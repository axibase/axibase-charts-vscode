import { CompletionItem, CompletionItemKind, InsertTextFormat, Position, TextDocument } from "vscode-languageserver-types";
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
export declare class CompletionProvider {
    private readonly text;
    private readonly currentLine;
    private readonly resourcesProvider;
    constructor(textDocument: TextDocument, position: Position, resourcesProvider: any);
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
