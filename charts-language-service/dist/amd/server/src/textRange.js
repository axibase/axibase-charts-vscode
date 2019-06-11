define(["require", "exports", "./util"], function (require, exports, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Contains the text and the position of the text
     */
    class TextRange {
        constructor(text, range, canBeUnclosed = false) {
            /**
             * Priority of the text, used in jsDomCaller: settings with higher priority are placed earlier in test js "file"
             */
            this.priority = 1 /* Low */;
            this.range = range;
            this.text = text;
            this.canBeUnclosed = canBeUnclosed;
        }
        /**
         * Checks is current keyword closeable or not (can be closed like var-endvar)
         * @param line the line containing the keyword
         * @returns true if the keyword closeable
         */
        static isCloseAble(line) {
            return /^[\s\t]*(?:for|if|list|sql|var|script[\s\t]*$|csv|else|elseif)\b/.test(line);
        }
        /**
         * Checks does the keyword close a section or not
         * @param line the line containing the keyword
         * @returns true if the keyword closes a section
         */
        static isClosing(line) {
            return /^[\s\t]*(?:end(?:for|if|list|var|script|sql|csv)|elseif|else)\b/.test(line);
        }
        /**
         * Parses a keyword from the line and creates a TextRange.
         * @param line the line containing the keyword
         * @param i the index of the line
         * @param canBeUnclosed whether keyword can exist in both closed and unclosed variant or not
         */
        static parse(line, i, canBeUnclosed) {
            const match = TextRange.KEYWORD_REGEXP.exec(line);
            if (match === null) {
                return undefined;
            }
            const [, indent, keyword] = match;
            return new TextRange(keyword, util_1.createRange(indent.length, keyword.length, i), canBeUnclosed);
        }
        /**
         * priority property setter
         */
        set textPriority(value) {
            this.priority = value;
        }
    }
    /**
     * Matches a keyword
     */
    TextRange.KEYWORD_REGEXP = 
    // tslint:disable-next-line: max-line-length
    /^([ \t]*)(import|endvar|endcsv|endfor|elseif|endif|endscript|endlist|endsql|script|else|if|list|sql|for|csv|var)\b/i;
    exports.TextRange = TextRange;
});
