/**
 * Represents a field in a script setting.
 * For example, `max` is a field in `alert-expression` setting
 */
export class Field {
    /**
     * Args which are passed to the field if it is a script
     */
    public readonly args: Field[];
    /**
     * Description of this field
     */
    public readonly description: string;
    /**
     * Name of this field
     */
    public readonly name: string;
    /**
     * Is this field required?
     * Useful on sub-levels, when describing fields of functions
     * which are passed to a setting.
     * For example, `alias` is required field in `avg()` function,
     * which is passed to `alert-expression`
     */
    public readonly required: boolean;
    /**
     * Type of this field. For example, `sum` is function,
     * whereas `metric` is string in `alert-expression`
     */
    public readonly type: string;

    public constructor(
        type: string,
        name: string,
        description: string = "",
        args: Field[] = [],
        required: boolean = true,
    ) {
        this.type = type;
        this.name = name;
        this.args = args;
        this.description = description;
        this.required = required;
    }
}
