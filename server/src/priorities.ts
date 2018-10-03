/**
 * Used in JavaScriptChecksQueue to ensure that the udf is placed earlier than it's first call
 */
const enum CheckPriority {
    High,
    Low
}