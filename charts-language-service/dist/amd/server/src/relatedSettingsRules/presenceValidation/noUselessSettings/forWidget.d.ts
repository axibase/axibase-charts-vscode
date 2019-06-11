import { Condition } from "../../utils/condition";
/**
 * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
 */
declare const checks: Map<string, Condition[]>;
export default checks;
