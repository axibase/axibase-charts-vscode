import * as assert from "assert";
import { Range } from "vscode-languageserver";
import { ConfigTree } from "../configTree";
import { TextRange } from "../textRange";
import { getSetting } from "../util";

suite("ConfigTree tests", () => {
    let tree!: ConfigTree;

    setup(() => {
        tree = new ConfigTree([]);
    });

    test("Inserts [configuration] without errors", () => {
        tree.addSection(textRange("configuration"), []);
    });

    test("Inserts [configuration], [group], [widget] and [tags] without errors", () => {
        tree.addSection(textRange("configuration"), []);
        tree.addSection(textRange("group"), []);
        tree.addSection(textRange("widget"), []);
        tree.addSection(textRange("tags"), []);
    });

    test("Inserts [configuration] and [widget] without errors", () => {
        tree.addSection(textRange("configuration"), []);
        tree.addSection(textRange("widget"), []);
    });

    test("thresholds and colors test", () => {
        tree.addSection(textRange("configuration"), []);
        tree.addSection(textRange("group"), []);
        const colors = getSetting("colors", textRange("colors").range);
        colors.value = "white, black";
        const thresholds = getSetting("thresholds", textRange("thresholds").range);
        thresholds.value = "0, 100";
        tree.addSection(textRange("widget"), [colors, thresholds]);
        tree.addSection(textRange("series"), []);
        tree.addSection(textRange("series"), []);
        tree.goThroughTree();
        assert.equal(tree.diagnostics.length, 1, "No duplicate error for colors");
        assert.equal(tree.diagnostics[0].message,
            `Number of colors (if specified) must be equal to\nnumber of thresholds minus 1.
Current: 2, expected: 1`);
        assert.deepEqual(tree.diagnostics[0].range,
            Range.create(0, 1, 0, "colors".length), "Colors must be highlighted");
    });

    function textRange(text: string): TextRange {
        return new TextRange(text, Range.create(0, 1, 0, text.length));
    }

});
