export type DateFunction = (t?: Date, next?: boolean) => Date | number | null;

// yyyy-mm-dd hh:mm:ss
export const ISO_LIKE_DATE_TEMPLATE: RegExp =
    // tslint:disable-next-line:max-line-length
    /^\s*(([0-9]{1,4}-)*[0-9]{1,4})?(\s+|^|$)([0-9]{1,2}:[0-9]{2}(:[0-9]{2}(\.[0-9]*)?)?)?(\s+([+\-])([0-9]{2})([0-9]{2}))?\s*$/;

/**
 * Returns 00:00:00 of the current day.
 *
 * @param d - Date object, which is used as base to construct target Date object
 * @param isUTC - If true, constructs target object as UTC date
 * @returns Date object, corresponding to 00:00:00 of the current day.
 */
export function getToday(d: Date, isUTC: boolean): Date {
    const target = getCurrentHour(d, isUTC);
    (isUTC ? target.setUTCHours : target.setHours).call(target, 0);
    return target;
}

/**
 * Returns current time rounded to the beginning of the current hour.
 *
 * @param d - Date object, which is used as base to construct target Date object
 * @param isUTC - If true, constructs target object as UTC date
 * @returns Date object, corresponding to 00 minutes and 00 seconds of the current hour.
 */
export function getCurrentHour(d: Date, isUTC: boolean): Date {
    (isUTC ? d.setUTCMinutes : d.setMinutes).call(getCurrentMinute(d, isUTC), 0);
    return d;
}

/**
 * Returns current time rounded to the beginning of the current minute.
 *
 * @param d - Date object, which is used as base to construct target Date object
 * @param isUTC - If true, constructs target object as UTC date
 * @returns Date object, corresponding to 00 seconds and 00 milliseconds of the current minute.
 */
export function getCurrentMinute(d: Date, isUTC: boolean): Date {
    (isUTC ? d.setUTCSeconds : d.setSeconds).call(d, 0);
    (isUTC ? d.setUTCMilliseconds : d.setMilliseconds).call(d, 0);
    return d;
}

/**
 * Returns day, shifted to specified offset.
 *
 * @param d - Date object, which is used as base to construct target Date object
 * @param offset - Shift value
 * @param isUTC - If true, constructs target object as UTC date
 * @returns Date object, corresponding to shifted day.
 */
export function shiftDay(d: Date, offset: number, isUTC: boolean) {
    if (offset) {
        (isUTC ? d.setUTCDate : d.setDate).call(d, (isUTC ? d.getUTCDate() : d.getDate()) + offset);
    }
    return d;
}

/**
 * Returns hour, shifted to specified offset.
 *
 * @param d - Date object, which is used as base to construct target Date object
 * @param offset - Shift value
 * @param isUTC - If true, constructs target object as UTC date
 * @returns Date object, corresponding to shifted hour.
 */
export function shiftHour(d: Date, offset: number, isUTC: boolean) {
    if (offset) {
        (isUTC ? d.setUTCHours : d.setHours).call(d, (isUTC ? d.getUTCHours() : d.getHours()) + offset);
    }
    return d;
}

/**
 * Returns minute, shifted to specified offset.
 *
 * @param d - Date object, which is used as base to construct target Date object
 * @param offset - Shift value
 * @param isUTC - If true, constructs target object as UTC date
 * @returns Date object, corresponding to shifted minute.
 */
export function shiftMinute(d: Date, offset: number, isUTC: boolean) {
    if (offset) {
        (isUTC ? d.setUTCMinutes : d.setMinutes).call(d, (isUTC ? d.getUTCMinutes() : d.getMinutes()) + offset);
    }
    return d;
}

/**
 * Returns number of days in current month.
 *
 * @param d - Date object, which is used as base to calculate days
 * @param isUTC - If true, evaluates d object as UTC date
 * @returns Number of days in month, corresponding to `d`.
 */
export function daysInMonth(d: Date, isUTC: boolean) {
    const copy = new Date(d);
    (isUTC ? d.setUTCDate : d.setDate).call(copy, 32);
    (isUTC ? d.setUTCDate : d.setDate).call(copy, 0);
    return (isUTC ? d.getUTCDate : d.getDate).call(copy);
}

/**
 * Returns true if day is sat or sun.
 *
 * @param n - Index of day to be checked
 * @returns True if `n` is 6 or 0.
 */
export function isWorkingDay(n: number) {
    return (n + 7) % 7 % 6;
}
