import { Diagnostic, Range } from "vscode-languageserver-types";
import { DefaultSetting } from "./defaultSetting";
export declare const intervalUnits: string[];
export declare const calendarKeywords: string[];
/**
 * In addition to DefaultSetting contains specific fields.
 */
export declare class Setting extends DefaultSetting {
    textRange: Range;
    /**
     * Setting value.
     */
    value: string;
    /**
     * Setting values for multiline settings (mostly for colors and thresholds).
     */
    values: string[];
    /**
     * Line number and characters placement of the setting.
     */
    private _textRange;
    constructor(setting: DefaultSetting);
    /**
     * Checks the type of the setting and creates a corresponding diagnostic
     * @param range where the error should be displayed
     */
    checkType(range: Range): Diagnostic | undefined;
    private checkNumber;
    private checkPercentile;
    private findIndexInEnum;
}
