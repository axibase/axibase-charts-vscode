import { Setting } from "../setting";
import { TextRange } from "../textRange";
import { Section } from "./section";
/**
 * Stores sections with corresponding settings in tree order.
 */
export declare class ConfigTree {
    private root;
    private lastAddedParent;
    private previous;
    readonly getRoot: Section;
    /**
     * Creates Section object based on `range` and `settings`, applies scope to it and adds to tree.
     * Doesn't alert if the section is out of order, this check is performed by SectionStack.
     *
     * @param range - The text (name of section) and the position of the text
     * @param settings - Section settings
     */
    addSection(range: TextRange, settings: Setting[]): void;
}
