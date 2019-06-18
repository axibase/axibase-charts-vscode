/**
 * Represents a field in a script setting.
 * For example, `max` is a field in `alert-expression` setting
 */
export class Field {
    constructor(type, name, description = "", args = [], required = true) {
        this.type = type;
        this.name = name;
        this.args = args;
        this.description = description;
        this.required = required;
    }
}
