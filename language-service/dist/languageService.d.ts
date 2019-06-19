import { Position, TextDocument } from "vscode-languageserver-types";
import { CompletionProvider } from "./completionProvider";
import { ResourcesProviderBase } from "./resourcesProviderBase";
export declare class LanguageService {
    resourcesProvider: ResourcesProviderBase;
    constructor(resourcesProvider: ResourcesProviderBase);
    getCompletionProvider(textDocument: TextDocument, position: Position): CompletionProvider;
}
