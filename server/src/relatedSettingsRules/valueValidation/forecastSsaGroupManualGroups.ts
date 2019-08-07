import { Diagnostic } from "vscode-languageserver";
import { Section } from "../../configTree/section";
import { createDiagnostic } from "../../util";
import { RelatedSettingsRule } from "../utils/interfaces";

const rule: RelatedSettingsRule = {
    name: "Validates forecast-ssa-group-manual-groups value syntax",
    check(section: Section): Diagnostic | void {
        const setting = section.getSettingFromTree("forecast-ssa-group-manual-groups");
        if (setting === void 0) {
            return;
        }
        if (!/^[\d\s,;-]+$/.test(setting.value)) {
            return createDiagnostic(
                setting.textRange,
                "Incorrect group syntax"
            );
        }
    }
};

export default rule;
