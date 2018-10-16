import { Diagnostic } from "vscode-languageserver";
import { Setting } from "./setting";
import { createDiagnostic } from "./util";

export class RelatedSettingsChecker {
    private declaredSettings: Setting[];

    /**
     * Check each setting in the current section (all in the whole document) for related settings
     * and validates this relations if required.
     * @param section if true, perform checks for the current section, otherwise for the all document
     * @param settings current section settings or all setings from document
     */
    public check(section: boolean, settings: Setting[]): Diagnostic[] {
        this.declaredSettings = settings;
        let result: Diagnostic[] = [];
        for (let setting of this.declaredSettings) {
            if (section) {
                switch (setting.displayName) {
                    case "gradient-count":
                        result = result.concat(this.simpleCheck("gradient-count", "color-range"));
                        break;
                    case "colors":
                        result = result.concat(this.checkColorsMatchTreshold());
                        break;
                    case "table":
                        result = result.concat(this.simpleCheck("table", "attribute"));
                        break;
                    case "attribute":
                        result = result.concat(this.simpleCheck("attribute", "table"));
                        break;
                    case "column-alert-style":
                        result = result.concat(this.simpleCheck("column-alert-style", "column-alert-expression"));
                        break;
                    case "alert-style":
                    case "link-alert-style":
                    case "node-alert-style":
                        result = result.concat(this.simpleCheck(setting.displayName, "alert-expression"));
                        break;
                    case "icon-alert-style":
                        result = result.concat(this.simpleCheck("icon-alert-style", "icon-alert-expression"));
                        break;
                    case "icon-alert-expression":
                    case "icon-color":
                    case "icon-position":
                    case "icon-size":
                        result = result.concat(this.simpleCheck(setting.displayName, "icon"));
                        break;
                    case "caption-style":
                        result = result.concat(this.simpleCheck("caption-style", "caption"));
                        break;
                    default: {
                        continue;
                    }
                }
            } else {
                switch (setting.displayName) {
                    case "forecast-style":
                        /**
                         * data-type can be specified at [series] section https://apps.axibase.com/chartlab/37c39d18/3/
                         */
                        result = result.concat(this.checkForecastStyleMatchDataType());
                        break;
                    default: {
                        continue;
                    }
                }
            }
        }

        return result;
    }

    private getSetting(settingName: string): Setting {
        const currentSetting = Setting.clearSetting(settingName);
        return this.declaredSettings.find(s => s.name === currentSetting);
    }

    /**
     * Checks setting with simple relations.
     * For example, the color-range is required if gradient-count is used, no additional checks are required.
     */
    private simpleCheck(dependent: string, checked: string): Diagnostic[] {
        const result: Diagnostic[] = [];
        const checkedSetting = this.getSetting(checked);
        if (!checkedSetting) {
            const dependentSetting = this.getSetting(dependent);
            result.push(createDiagnostic(dependentSetting.textRange,
                `${checked} is required if ${dependent} is specified`));
        }

        return result;
    }

    /**
     * Check the relationship between thresholds and colors:
     * in "gauge", "calendar", "treemap" number of colors (if specified) must be equal to number of thresholds minus 1.
     */
    private checkColorsMatchTreshold(): Diagnostic[] {
        const result: Diagnostic[] = [];
        const typeValue = this.getSetting("type").value;
        if (["gauge", "calendar", "treemap"].includes(typeValue)) {
            const thresholds: Setting = this.getSetting("thresholds");
            const colors: Setting = this.getSetting("colors");
            let thresholdsValue: string;
            let colorsValue: string;
            if (thresholds) {
                thresholdsValue = this.getSetting("thresholds").value;
            }
            if (colors) {
                colorsValue = this.getSetting("colors").value;
            }
            if (colorsValue && thresholdsValue) {
                if (colorsValue.split(/[^\d],[^\d]/g).length !== (thresholdsValue.split(",").length - 1)) {
                    result.push(createDiagnostic(colors.textRange,
                        `Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.`));
                }
            } else if (colorsValue) {
                result.push(createDiagnostic(colors.textRange, `thresholds are required if colors are specified`));
            }
        }
        return result;
    }

    /**
     * Check the relationship between forecast-style and data-type if mode is column or column-stack.
     */
    private checkForecastStyleMatchDataType(): Diagnostic[] {
        let result: Diagnostic[] = [];
        const mode = this.getSetting("mode");
        const forecastStyle = this.getSetting("forecast-style");
        if (!mode && /(?:column-stack|column)/.test(mode.value)) {
            result.push(createDiagnostic(forecastStyle.textRange,
                `CSS styles applied to forecasts only in column and column-stack modes.`));
        } else {
            result = this.simpleCheck("forecast-style", "data-type");
        }
        return result;
    }
}
