import { BOOLEAN_KEYWORDS, INTERVAL_UNITS } from "./constants";

/** Regular expressions for CSV syntax checking */
/**
 * RegExp for: `csv <name> =
 *              <header1>, <header2>`
 */
export const CSV_NEXT_LINE_HEADER_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(=)/m;
/**
 * RegExp for: 'csv <name> = <header1>, <header2>'
 */
export const CSV_INLINE_HEADER_PATTERN = /=[ \t]*$/m;
/**
 * RegExp for: 'csv <name> from <url>'
 */
export const CSV_FROM_URL_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(from)/m;
/**
 * RegExp for blank line
 */
export const BLANK_LINE_PATTERN = /^[ \t]*$/m;
/**
 * RegExp for 'csv' keyword
 */
export const CSV_KEYWORD_PATTERN = /\b(csv)\b/i;

/**
 * RegExp for: 'csv from <url>'
 */
export const CSV_FROM_URL_MISSING_NAME_PATTERN = /(^[ \t]*csv[ \t]+)[ \t]*(from)/;

/** Regular expressions to match SQL */
export const ONE_LINE_SQL = /^\s*sql\s*=.*$/m;
export const BLOCK_SQL_START_WITHOUT_LF = /(^\s*)sql\s*\S/;
export const BLOCK_SQL_START = /sql(?!([\s\S]*=))/;
export const BLOCK_SQL_END = /^\s*endsql\s*$/;

/**
 * Regular expressions to match script.
 */
export const ONE_LINE_SCRIPT = /^\s*script\s*=.*$/m;
export const BLOCK_SCRIPT_START_WITHOUT_LF = /(^\s*)script\s*\S/;
export const BLOCK_SCRIPT_START = /script(?!([\s\S]*=))/;
export const BLOCK_SCRIPT_END = /^\s*endscript\s*$/;

export const BOOLEAN_REGEXP: RegExp = new RegExp(`^(?:${BOOLEAN_KEYWORDS.join("|")})$`);

export const INTEGER_REGEXP: RegExp = /^[-+]?\d+$/;

export const INTERVAL_REGEXP: RegExp = new RegExp(
    // -5 month, +3 day, .3 year, 2.3 week, all
    `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${INTERVAL_UNITS.join("|")}))|all)$`,
);

// 1, 5.2, 0.3, .9, -8, -0.5, +1.4
export const NUMBER_REGEXP: RegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;

export const CALCULATED_REGEXP: RegExp = /[@$]\{.+\}/;
