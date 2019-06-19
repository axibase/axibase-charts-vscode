import { Position, TextDocument } from "vscode-languageserver-types";
import { CompletionProvider } from "./completionProvider";
import { ResourcesProviderBase } from "./resourcesProviderBase";

export class LanguageService {
    public resourcesProvider: ResourcesProviderBase;

    constructor(resourcesProvider: ResourcesProviderBase) {
        this.resourcesProvider = resourcesProvider;
    }

    public getCompletionProvider(textDocument: TextDocument, position: Position) {
        return new CompletionProvider(textDocument, position, this.resourcesProvider);
    }
}
