import { Diagnostic } from "vscode-languageserver-types";
import { TextRange } from "./textRange";
export declare const BLOCK_SQL_START: RegExp;
export declare const BLOCK_SQL_END: RegExp;
export declare const BLOCK_SCRIPT_START: RegExp;
export declare const BLOCK_SCRIPT_END: RegExp;
export declare class KeywordHandler {
    diagnostics: Diagnostic[];
    keywordsStack: TextRange[];
    constructor(keywordsStack: TextRange[]);
    handleSql(line: string, foundKeyword: TextRange): void;
    handleScript(line: string, foundKeyword: TextRange): void;
}
