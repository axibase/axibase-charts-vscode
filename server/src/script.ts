import { Field } from "./field";

/// <amd-module name="Script"/>
export class Script {
    public readonly fields: Field[];
    public readonly returnValue: string | number | boolean;

    public constructor(returnValue: string | number | boolean, fields: Field[] = []) {
        this.returnValue = returnValue;
        this.fields = fields;
    }
}
