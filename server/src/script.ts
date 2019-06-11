import { Field } from "./field";

export class Script {
    public readonly fields: Field[];
    public readonly returnValue: string | number | boolean;

    public constructor(returnValue: string | number | boolean, fields: Field[] = []) {
        this.returnValue = returnValue;
        this.fields = fields;
    }
}
