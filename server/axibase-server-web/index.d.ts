import { CompletionProvider } from "./dist/server/src/completionProvider";
import { Validator } from "./dist/server/src/validator";

export interface server {
    CompletionProvider: CompletionProvider
    Validator: Validator
}