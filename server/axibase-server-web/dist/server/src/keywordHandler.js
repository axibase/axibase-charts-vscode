define(["require", "exports", "./messageUtil", "./util"], function (require, exports, messageUtil_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Regular expressions to match SQL.
     */
    const ONE_LINE_SQL = /^\s*sql\s*=.*$/m;
    const BLOCK_SQL_START_WITHOUT_LF = /(^\s*)sql\s*\S/;
    exports.BLOCK_SQL_START = /sql(?!([\s\S]*=))/;
    exports.BLOCK_SQL_END = /^\s*endsql\s*$/;
    /**
     * Regular expressions to match script.
     */
    const ONE_LINE_SCRIPT = /^\s*script\s*=.*$/m;
    const BLOCK_SCRIPT_START_WITHOUT_LF = /(^\s*)script\s*\S/;
    exports.BLOCK_SCRIPT_START = /script(?!([\s\S]*=))/;
    exports.BLOCK_SCRIPT_END = /^\s*endscript\s*$/;
    class KeywordHandler {
        constructor(keywordsStack) {
            this.diagnostics = [];
            this.keywordsStack = keywordsStack;
        }
        handleSql(line, foundKeyword) {
            if (ONE_LINE_SQL.test(line)) {
                return;
            }
            this.keywordsStack.push(foundKeyword);
            const match = BLOCK_SQL_START_WITHOUT_LF.exec(line);
            if (match !== null) {
                this.diagnostics.push(util_1.createDiagnostic(util_1.createRange(match[1].length, "sql".length, foundKeyword.range.start.line), messageUtil_1.lineFeedRequired("sql")));
            }
        }
        handleScript(line, foundKeyword) {
            if (ONE_LINE_SCRIPT.test(line)) {
                return;
            }
            this.keywordsStack.push(foundKeyword);
            const match = BLOCK_SCRIPT_START_WITHOUT_LF.exec(line);
            if (match !== null) {
                this.diagnostics.push(util_1.createDiagnostic(util_1.createRange(match[1].length, "script".length, foundKeyword.range.start.line), messageUtil_1.lineFeedRequired("script")));
            }
        }
    }
    exports.KeywordHandler = KeywordHandler;
});
