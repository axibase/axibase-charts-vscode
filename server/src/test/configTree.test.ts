import { Range } from "vscode-languageserver";
import { ConfigTree } from "../configTree";
import { TextRange } from "../textRange";

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
        tree.addSection(textRange("group", 1), []);
        tree.addSection(textRange("widget", 2), []);
        tree.addSection(textRange("tags", 3), []);
    });

    test("Inserts [configuration] and [widget] without errors", () => {
        tree.addSection(textRange("configuration"), []);
        tree.addSection(textRange("widget", 1), []);
    });

    function textRange(text: string, line: number = 0): TextRange {
        return new TextRange(text, Range.create(line, 1, line, text.length));
    }

});
