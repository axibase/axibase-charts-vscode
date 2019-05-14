import { Diagnostic } from "vscode-languageserver";
import { RelatedSettingsRule, Section } from "../configTree";
import { createDiagnostic, getSetting } from "../util";

const rule: RelatedSettingsRule = {
    name: "Forecast SSA limit check",
    rule(section: Section): Diagnostic | void {
        const forecastLimit = section.getSettingFromTree("forecast-ssa-decompose-eigentriple-limit");
        const groupAutoCount = section.getSettingFromTree("forecast-ssa-group-auto-count");
        const defaultValue = getSetting("forecast-ssa-decompose-eigentriple-limit").defaultValue;

        if (groupAutoCount === undefined) {
            return;
        }

        const eigentripleLimitValue = forecastLimit ? forecastLimit.value : defaultValue;
        if (eigentripleLimitValue <= groupAutoCount.value) {
            return createDiagnostic(groupAutoCount.textRange,
                `forecast-ssa-group-auto-count ` +
                `must be less than forecast-ssa-decompose-eigentriple-limit (default 0)`);
        }
    }
};

export default rule;
