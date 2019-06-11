import { Field } from "./field";
export declare class Script {
    readonly fields: Field[];
    readonly returnValue: string | number | boolean;
    constructor(returnValue: string | number | boolean, fields?: Field[]);
}
