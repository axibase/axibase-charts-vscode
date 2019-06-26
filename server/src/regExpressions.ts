import { booleanKeywords, calendarKeywords, intervalUnits } from "./constants";

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

/**
 * Regular expressions to match SQL.
 */
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

export const booleanRegExp: RegExp = new RegExp(`^(?:${booleanKeywords.join("|")})$`);

export const calendarRegExp: RegExp = new RegExp(
    // current_day
    `^(?:${calendarKeywords.join("|")})` +
    // + 5 * minute
    `(?:[ \\t]*[-+][ \\t]*(?:\\d+|(?:\\d+)?\\.\\d+)[ \\t]*\\*[ \\t]*(?:${intervalUnits.join("|")}))?$`,
);

export const integerRegExp: RegExp = /^[-+]?\d+$/;

export const intervalRegExp: RegExp = new RegExp(
    // -5 month, +3 day, .3 year, 2.3 week, all
    `^(?:(?:[-+]?(?:(?:\\d+|(?:\\d+)?\\.\\d+)|@\\{.+\\})[ \\t]*(?:${intervalUnits.join("|")}))|all)$`,
);

export const localDateRegExp: RegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12][0-9]|3[01])" +
    // 01:13:46.123, 11:26:52
    "(?: (?:[01]\\d|2[0-4]):(?:[0-5][0-9])(?::(?:[0-5][0-9]))?(?:\\.\\d{1,9})?)?)?)?$",
);

// 1, 5.2, 0.3, .9, -8, -0.5, +1.4
export const numberRegExp: RegExp = /^(?:\-|\+)?(?:\.\d+|\d+(?:\.\d+)?)$/;

export const zonedDateRegExp: RegExp = new RegExp(
    // 2018-12-31
    "^(?:19[7-9]|[2-9]\\d\\d)\\d-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])" +
    // T12:34:46.123, T23:56:18
    "[tT](?:[01]\\d|2[0-4]):(?:[0-5][0-9]):(?:[0-5][0-9])(?:\\.\\d{1,9})?" +
    // Z, +0400, -05:00
    "(?:[zZ]|[+-](?:[01]\\d|2[0-4]):?(?:[0-5][0-9]))$",
);

export const calculatedRegExp: RegExp = /[@$]\{.+\}/;
