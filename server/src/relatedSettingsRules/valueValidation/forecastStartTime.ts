import { Diagnostic } from "vscode-languageserver";
import { Section } from "../../configTree/section";
import { parseTimeValue } from "../../util";
import { RelatedSettingsRule } from "../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Validates forecast-horizon-start-time value",
    check(section: Section): Diagnostic | void {
        let forecast = section.getSettingFromTree("forecast-horizon-start-time");
        if (forecast === undefined) {
            return;
        }
        const errors: Diagnostic[] = [];
        parseTimeValue(forecast, section, errors);
        if (errors.length > 0) {
            return errors[0];
        }
    }
};

export default rule;
