import { Position, TextDocument } from "vscode-languageserver-types";
import { CompletionProvider } from "./completionProvider";

export class LanguageService<T> {
    public resourcesProvider: T;

    constructor(resourcesProvider: T) {
        this.resourcesProvider = resourcesProvider;
    }

    public getCompletionProvider(textDocument: TextDocument, position: Position) {
        return new CompletionProvider(textDocument, position, this.resourcesProvider);
    }
}
