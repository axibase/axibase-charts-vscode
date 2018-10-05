import { Test } from "./test";
import { Position } from "vscode-languageserver";


suite("CompletionProvider tests", () => {
    [
        new Test(
            "Correct: completion using possibleValues",
            `type = `,
            ["chart", "gauge", "treemap", "bar", "calendar", "histogram", "box", "pie", "graph", "text", "page", "console", "table",
                "property"],
            undefined,
            Position.create(0, "type = ".length),
        ),
        new Test(
            "Correct: completion using example",
            `url = `,
            ["http://atsd_hostname:port"],
            undefined,
            Position.create(0, "url = ".length),
        ),
        new Test(
            "Correct: completion using example and script",
            `alert-style = `,
            ["stroke: red; stroke-width: 2", "alert"],
            undefined,
            Position.create(0, "alert-style = ".length),
        )
    ].forEach((test: Test): void => test.completionTest());
});
