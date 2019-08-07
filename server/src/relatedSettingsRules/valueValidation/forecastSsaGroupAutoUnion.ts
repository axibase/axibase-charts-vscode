import { Diagnostic } from "vscode-languageserver";
import { Section } from "../../configTree/section";
import { createDiagnostic } from "../../util";
import { RelatedSettingsRule } from "../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Validates forecast-ssa-group-auto-union value syntax",
    check(section: Section): Diagnostic | void {
        const setting = section.getSettingFromTree("forecast-ssa-group-auto-union");
        if (setting === void 0) {
            return;
        }
        if (!/^[a-z\s,;-]+$/.test(setting.value)) {
            return createDiagnostic(
                setting.textRange,
                "Incorrect group union syntax"
            );
        }
    }
};

export default rule;
