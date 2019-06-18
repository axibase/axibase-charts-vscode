import { Position, TextDocument } from "vscode-languageserver-types";
import { CompletionProvider } from "./completionProvider";
export declare class LanguageService<T> {
    resourcesProvider: T;
    constructor(resourcesProvider: T);
    getCompletionProvider(textDocument: TextDocument, position: Position): CompletionProvider;
}
