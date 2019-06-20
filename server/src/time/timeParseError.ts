export class TimeParseError extends Error {
    public wrongValue: string;
    public message: string;

    /**
     * Constructs error, thrown during time settings parsing.
     * @param wrongValue - Incorrect value, which is the reason of the error
     * @param message - Specific description of the error
     */
    constructor(wrongValue: string, message: string) {
        super(message);
        this.message = message + ": " + wrongValue;
        this.wrongValue = wrongValue;
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error()).stack;
        }
    }
}
