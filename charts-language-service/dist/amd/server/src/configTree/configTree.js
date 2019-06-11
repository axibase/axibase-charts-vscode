define(["require", "exports", "../resources", "./section"], function (require, exports, resources_1, section_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Stores sections with corresponding settings in tree order.
     */
    class ConfigTree {
        get getRoot() {
            return this.root;
        }
        /**
         * Creates Section object based on `range` and `settings`, applies scope to it and adds to tree.
         * Doesn't alert if the section is out of order, this check is performed by SectionStack.
         *
         * @param range - The text (name of section) and the position of the text
         * @param settings - Section settings
         */
        addSection(range, settings) {
            const section = new section_1.Section(range, settings);
            const depth = resources_1.sectionDepthMap[range.text];
            if (depth > 0 && !this.root) {
                return;
            }
            switch (depth) {
                case 0: { // [configuration]
                    this.root = section;
                    this.lastAddedParent = section;
                    break;
                }
                case 1: { // [group]
                    section.parent = this.root;
                    this.lastAddedParent = section;
                    break;
                }
                case 2: { // [widget]
                    const group = this.root.children[this.root.children.length - 1];
                    if (!group) {
                        return;
                    }
                    section.parent = group;
                    this.lastAddedParent = section;
                    break;
                }
                case 3: { // [series], [dropdown], [column], ...
                    if (this.lastAddedParent && this.lastAddedParent.name === "column" && range.text === "series") {
                        section.parent = this.lastAddedParent;
                    }
                    else {
                        const group = this.root.children[this.root.children.length - 1];
                        if (!group) {
                            return;
                        }
                        const widget = group.children[group.children.length - 1];
                        if (!widget) {
                            return;
                        }
                        section.parent = widget;
                        this.lastAddedParent = section;
                    }
                    break;
                }
                case 4: { // [option], [properties], [tags]
                    if (resources_1.isNestedToPrevious(range.text, this.previous.name)) {
                        section.parent = this.previous;
                    }
                    else {
                        section.parent = this.lastAddedParent;
                    }
                    if (!section.parent) {
                        return;
                    }
                    break;
                }
            }
            if (section.parent) {
                // We are not in [configuration]
                section.parent.children.push(section);
            }
            this.previous = section;
            section.applyScope();
        }
    }
    exports.ConfigTree = ConfigTree;
});
