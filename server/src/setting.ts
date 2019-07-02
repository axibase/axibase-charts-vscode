import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { INTERVAL_UNITS } from "./constants";
import { DefaultSetting } from "./defaultSetting";
import { illegalSetting } from "./messageUtil";
import {
  BOOLEAN_REGEXP,
  CALCULATED_REGEXP,
  INTEGER_REGEXP,
  INTERVAL_REGEXP,
  NUMBER_REGEXP,
} from "./regExpressions";
import { createDiagnostic } from "./util";

interface SpecificValueCheck {
  errMsg: string;
  isIncorrect: (value: string) => boolean;
}

const specificValueChecksMap: Map<string, SpecificValueCheck> = new Map([
  ["forecastssagroupmanualgroups", {
    errMsg: "Incorrect group syntax",
    isIncorrect: (value: string) => {
      const regex = /^[\d\s,;-]+$/;
      return !regex.test(value);
    }
  }],
  ["forecastssagroupautounion", {
    errMsg: "Incorrect group union syntax",
    isIncorrect: (value: string) => {
      const regex = /^[a-z\s,;-]+$/;
      return !regex.test(value);
    }
  }]
]);

/**
 * In addition to DefaultSetting contains specific fields.
 */
export class Setting extends DefaultSetting {

  get textRange(): Range {
    return this._textRange;
  }

  set textRange(value: Range) {
    this._textRange = value;
  }

  /**
   * Setting value, specified in config.
   */
  public value: string = "";
  /**
   * Setting values for multiline settings (mostly for colors and thresholds), specified in config.
   */
  public values: string[] = [];
  /**
   * Line number and characters placement of the setting.
   */
  // tslint:disable-next-line: variable-name
  private _textRange: Range;

  public constructor(setting: DefaultSetting) {
    super(setting);
  }

  /**
   * Checks the type of the setting and creates a corresponding diagnostic
   * @param range where the error should be displayed
   */
  public checkType(range: Range): Diagnostic | undefined {
    let result: Diagnostic | undefined;
    // allows ${} and @{} expressions
    if (CALCULATED_REGEXP.test(this.value)) {
      return result;
    }
    switch (this.type) {
      case "string": {
        if (!/\S/.test(this.value)) {
          result = createDiagnostic(range, `${this.displayName} can not be empty`);
          break;
        }
        if (this.enum.length > 0) {
          if (this.value.split(/\s*,\s*/).some(s => this.enum.indexOf(s) < 0)) {
            const enumList: string = this.enum.sort().join("\n * ");
            result = createDiagnostic(range,
              `${this.displayName} must contain only the following:\n * ${enumList}`);
          }
          break;
        }
        const specCheck = specificValueChecksMap.get(this.name);
        if (specCheck && specCheck.isIncorrect(this.value)) {
          result = createDiagnostic(range, specCheck.errMsg);
        }
        break;
      }
      case "number": {
        const persent = /(\d*)%/.exec(this.value);
        if (this.name === "arrowlength" && persent) {
          this.maxValue = typeof this.maxValue === "object" ? this.maxValue.value * 100 : this.maxValue * 100;
          this.minValue = typeof this.minValue === "object" ? this.minValue.value * 100 : this.minValue * 100;
          this.value = persent[1];
        }
        result = this.checkNumber(NUMBER_REGEXP,
          `${this.displayName} should be a real (floating-point) number.`,
          range);

        break;
      }
      case "integer": {
        result = this.checkNumber(INTEGER_REGEXP,
          `${this.displayName} should be an integer number.`,
          range);
        break;
      }
      case "boolean": {
        if (!BOOLEAN_REGEXP.test(this.value)) {
          result = createDiagnostic(
            range,
            `${this.displayName} should be a boolean value. For example, ${this.example}`,
          );
        }
        break;
      }
      case "enum": {
        const index: number = this.findIndexInEnum(this.value);
        // Empty enum means that the setting is not allowed
        if (this.enum.length === 0) {
          result = createDiagnostic(range, illegalSetting(this.displayName));
        } else if (index < 0) {
          if (/percentile/.test(this.value) && /statistic/.test(this.name)) {
            result = this.checkPercentile(range);
            break;
          }
          const enumList: string = this.enum.sort().
            join("\n * ").
            replace(/percentile\\.+/, "percentile(n)");
          result = createDiagnostic(range,
            `${this.displayName} must be one of:\n * ${enumList}`);
        }
        break;
      }
      case "interval": {
        if (!INTERVAL_REGEXP.test(this.value)) {
          const message =
            `.\nFor example, ${this.example}. Supported units:\n * ${INTERVAL_UNITS.join(
              "\n * ")}`;
          if (this.name === "updateinterval" && /^\d+$/.test(this.value)) {
            result = createDiagnostic(
              range,
              `Specifying the interval in seconds is deprecated.\nUse \`count unit\` format${message}`,
              DiagnosticSeverity.Warning,
            );
          } else {
            /**
             * Check other allowed non-interval values
             * (for example, period, summarize-period, group-period supports "auto")
             */
            if (this.enum.length > 0) {
              if (this.findIndexInEnum(this.value) < 0) {
                result = createDiagnostic(range,
                  `Use ${this.enum.sort().
                    join(
                      ", ")} or \`count unit\` format${message}`);
              }
            } else {
              result = createDiagnostic(range,
                `${this.displayName} should be set as \`count unit\`${message}`);
            }
          }
        }
        break;
      }
      case "date": {
        // Is checked in RelatedSettingsRule.
        break;
      }
      case "object": {
        try {
          JSON.parse(this.value);
        } catch (err) {
          result = createDiagnostic(range,
            `Invalid object specified: ${err.message}`);
        }
        break;
      }
      default: {
        throw new Error(`${this.type} is not handled`);
      }
    }

    return result;
  }

  private checkNumber(reg: RegExp, message: string, range: Range): Diagnostic {
    const example = ` For example, ${this.example}`;
    if (!reg.test(this.value)) {
      return createDiagnostic(range, `${message}${example}`);
    }
    const minValue = typeof this.minValue === "object" ?
      this.minValue.value :
      this.minValue;
    const minValueExcluded = typeof this.minValue === "object" ?
      this.minValue.excluded :
      false;
    const maxValue = typeof this.maxValue === "object" ?
      this.maxValue.value :
      this.maxValue;
    const maxValueExcluded = typeof this.maxValue === "object" ?
      this.maxValue.excluded :
      false;
    const left = minValueExcluded ? `(` : `[`;
    const right = maxValueExcluded ? `)` : `]`;
    if (minValueExcluded && +this.value <= minValue || +this.value < minValue ||
      maxValueExcluded && +this.value >= maxValue || +this.value > maxValue) {
      return createDiagnostic(
        range,
        `${this.displayName} should be in range ${left}${minValue}, ${maxValue}${right}.${example}`,
      );
    }
    return undefined;
  }

  private checkPercentile(range: Range): Diagnostic | undefined {
    let result: Diagnostic;
    const n = this.value.match(/[^percntil_()]+/);
    if (n && +n[0] >= 0 && +n[0] <= 100) {
      if (/_/.test(this.value)) {
        result = createDiagnostic(range,
          `Underscore is deprecated, use percentile(${n[0]}) instead`,
          DiagnosticSeverity.Warning);
      } else if (!new RegExp(`\\(${n[0]}\\)`).test(this.value)) {
        result = createDiagnostic(range,
          `Wrong usage. Expected: percentile(${n[0]}).
Current: ${this.value}`);
      }
    } else {
      result = createDiagnostic(range,
        `n must be a decimal number between [0, 100]. Current: ${n ?
          n[0] :
          n}`);
    }
    return result;
  }

  private findIndexInEnum(value: string) {
    return this.enum.findIndex((option: string): boolean =>
      new RegExp(`^${option}$`, "i").test(value),
    );
  }
}
