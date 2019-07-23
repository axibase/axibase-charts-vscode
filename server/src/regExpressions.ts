import { BOOLEAN_KEYWORDS, INTERVAL_UNITS, RELATIONS } from "./constants";

/** Regular expressions for CSV syntax checking */

//  csv <name> =
//  <header1>, <header2>
export const CSV_NEXT_LINE_HEADER_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(=)/m;

// csv <name> = <header1>, <header2>
export const CSV_INLINE_HEADER_PATTERN = /=[ \t]*$/m;

// csv <name> from <url>
export const CSV_FROM_URL_PATTERN = /(^[ \t]*csv[ \t]+)(\w+)[ \t]*(from)/m;

// blank line
export const BLANK_LINE_PATTERN = /^[ \t]*$/m;

// csv
export const CSV_KEYWORD_PATTERN = /\b(csv)\b/i;

// csv from <url>
export const CSV_FROM_URL_MISSING_NAME_PATTERN = /(^[ \t]*csv[ \t]+)[ \t]*(from)/;

/** Regular expressions to match SQL */

// sql = SELECT time, entity, value FROM cpu_busy
export const ONE_LINE_SQL = /^\s*sql\s*=.*$/m;

// sql SELECT 1
export const BLOCK_SQL_START_WITHOUT_LF = /(^\s*)sql\s*\S/;

// sql
export const BLOCK_SQL_START = /sql(?!([\s\S]*=))/;

// endsql
export const BLOCK_SQL_END = /^\s*endsql\s*$/;

/** Regular expressions to match script */

// script = console.log()
// Don't add global flag to this regex to avoid exec lastIndex issue
export const ONE_LINE_SCRIPT = /^\s*script\s*=\s*(.*)/;

// script alert("Hello, world!")
export const BLOCK_SCRIPT_START_WITHOUT_LF = /(^\s*)script\s*\S/;

// script
export const BLOCK_SCRIPT_START = /(?:^\s*)script(?!([\s\S]*=))/;

// endscript
export const BLOCK_SCRIPT_END = /^\s*endscript\s*$/;

/** Various regular expressions */

// false, no, null, none, 0, off, true, yes, on, 1
export const BOOLEAN_REGEXP: RegExp = new RegExp(`^(?:${BOOLEAN_KEYWORDS.join("|")})$`);

// 07, +3, -81
export const INTEGER_REGEXP: RegExp = /^[-+]?\d+$/;

export const INTERVAL_REGEXP: RegExp = new RegExp(
    // -5 month, +3 day, .3 year, 2.3 week, all
    `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${INTERVAL_UNITS.join("|")}))|all)$`,
);

// 1, 5.2, 0.3, .9, -8, -0.5, +1.4
export const NUMBER_REGEXP: RegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;

// ${server}, ${example}
export const CALCULATED_REGEXP: RegExp = /[@$]\{.+\}/;

// =, ==, !=, >=, <=, >, <
export const RELATIONS_REGEXP: RegExp =  new RegExp(`(^\\s*.+?)(\\s*?)(${RELATIONS.join("|")})(\\s*)`);
