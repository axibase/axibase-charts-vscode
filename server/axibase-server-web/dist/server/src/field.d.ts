/**
 * Represents a field in a script setting.
 * For example, `max` is a field in `alert-expression` setting
 */
export declare class Field {
    /**
     * Args which are passed to the field if it is a script
     */
    readonly args: Field[];
    /**
     * Description of this field
     */
    readonly description: string;
    /**
     * Name of this field
     */
    readonly name: string;
    /**
     * Is this field required?
     * Useful on sub-levels, when describing fields of functions
     * which are passed to a setting.
     * For example, `alias` is required field in `avg()` function,
     * which is passed to `alert-expression`
     */
    readonly required: boolean;
    /**
     * Type of this field. For example, `sum` is function,
     * whereas `metric` is string in `alert-expression`
     */
    readonly type: string;
    constructor(type: string, name: string, description?: string, args?: Field[], required?: boolean);
}
