import { CompletionProvider } from "./completionProvider";
export class LanguageService {
    constructor(resourcesProvider) {
        this.resourcesProvider = resourcesProvider;
    }
    getCompletionProvider(textDocument, position) {
        return new CompletionProvider(textDocument, position, this.resourcesProvider);
    }
}
