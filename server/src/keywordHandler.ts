import { Diagnostic } from "vscode-languageserver";
import { lineFeedRequired } from "./messageUtil";
import { TextRange } from "./textRange";
import { createDiagnostic, createRange } from "./util";

/**
 * Regular expressions to match SQL.
 */
const ONE_LINE_SQL = /^\s*sql\s*=.*$/m;
const BLOCK_SQL_START_WITHOUT_LF = /(^\s*)sql\s*\S/;
export const BLOCK_SQL_START = /sql(?!([\s\S]*=))/;
export const BLOCK_SQL_END = /^\s*endsql\s*$/;

/**
 * Regular expressions to match script.
 */
const ONE_LINE_SCRIPT = /^\s*script\s*=.*$/m;
const BLOCK_SCRIPT_START_WITHOUT_LF = /(^\s*)script\s*\S/;
export const BLOCK_SCRIPT_START = /script(?!([\s\S]*=))/;
export const BLOCK_SCRIPT_END = /^\s*endscript\s*$/;

export class KeywordHandler {
    public diagnostics: Diagnostic[] = [];
    public keywordsStack: TextRange[];

    constructor(keywordsStack: TextRange[]) {
        this.keywordsStack = keywordsStack;
    }

    public handleSql(line: string, foundKeyword: TextRange): void {
        if (ONE_LINE_SQL.test(line)) {
            return;
        }
        this.keywordsStack.push(foundKeyword);
        const match = BLOCK_SQL_START_WITHOUT_LF.exec(line);
        if (match !== null) {
            this.diagnostics.push(
                createDiagnostic(
                    createRange(match[1].length, "sql".length, foundKeyword.range.start.line),
                    lineFeedRequired("sql")
                ));
        }
    }

    /**
     * Checks `if` condition syntax
     */
    public handleIf(line: string, foundKeyword: TextRange): void {
        const ifConditionRegex: RegExp = /^[\s].*if\s*(.*)/;
        const ifCondition = ifConditionRegex.exec(line)[1];

        try {
            Function(`return ${ifCondition}`);
        } catch (err) {
            this.diagnostics.push(createDiagnostic(createRange(
                line.indexOf(ifCondition),
                ifCondition.length,
                foundKeyword.range.start.line
            ), err.message));
        }
    }

    public handleScript(line: string, foundKeyword: TextRange): void {
        if (ONE_LINE_SCRIPT.test(line)) {
            return;
        }
        this.keywordsStack.push(foundKeyword);
        const match = BLOCK_SCRIPT_START_WITHOUT_LF.exec(line);
        if (match !== null) {
            this.diagnostics.push(createDiagnostic(
                createRange(match[1].length, "script".length, foundKeyword.range.start.line),
                lineFeedRequired("script")
            ));
        }
    }
}
