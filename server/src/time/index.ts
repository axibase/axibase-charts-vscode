import { Diagnostic } from "vscode-languageserver-types";
import { Section } from "../configTree/section";
import { dateError } from "../messageUtil";
import { Setting } from "../setting";
import { createDiagnostic, getValueOfSetting } from "../util";
import { TimeParseError } from "./timeParseError";
import { TimeParser } from "./timeParser";

const timeParseCache: Map<Setting, Date> = new Map<Setting, Date>();
/**
 * Parses value of time setting, adds diagnostic to `errors` if any error during parsing was thrown.
 *
 * @param timeSetting - Date setting, which value is need to be parsed
 * @param timeParser - Util class, containig methods for date parsing
 * @param errors - Array of diagnosics, to which information about error is added
 * @returns Value of `timeSetting`, parsed to Date.
 */
export function parseTimeValue(timeSetting: Setting, section: Section, errors: Diagnostic[]): Date {
    let parsedValue;
    if (timeSetting != null) {
        if (timeParseCache.has(timeSetting)) {
            const cached = timeParseCache.get(timeSetting);
            if (cached instanceof Date) {
                return cached;
            }
            return null;
        }
        try {
            const timeZoneValue = getValueOfSetting("time-zone", section);
            const timeParser = new TimeParser(timeZoneValue as string);
            parsedValue = timeParser.parseDateTemplate(timeSetting.value);
            timeParseCache.set(timeSetting, parsedValue);
        } catch (err) {
            if (err instanceof TimeParseError) {
                const diagnostic = createDiagnostic(timeSetting.textRange,
                    dateError(err.message, timeSetting.displayName));
                errors.push(diagnostic);
            } else {
                throw err;
            }
        }
    }
    return parsedValue;
}
