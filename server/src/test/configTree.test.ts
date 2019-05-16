import { Range } from "vscode-languageserver";
import { ConfigTree } from "../configTree/configTree";
import { TextRange } from "../textRange";

suite("ConfigTree tests", () => {
    let tree!: ConfigTree;

    setup(() => {
        tree = new ConfigTree();
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

    function textRange(text: string): TextRange {
        return new TextRange(text, Range.create(0, 1, 0, text.length));
    }

});
