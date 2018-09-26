import { Position, Range } from "vscode-languageserver";
import { Test } from "./test";

suite("Hover tests", () => {
    [
        new Test(
            "Hover place is calculated properly",
            `[configuration]
  entity-expression = cpu_busy`,
            {
                contents: "Apply server-side filter to all series based on entity names, tags, and fields.",
                range: Range.create(1, "  ".length, 1, "  ".length + "entity-expression".length),
            },
            undefined,
            Position.create(1, "  ent".length),
        ),
        new Test(
            "Hover is not provided for a value",
            `[configuration]
  entity-expression = cpu_busy`,
            null,
            undefined,
            Position.create(1, "  entity-expression = c".length),
        ),
        new Test(
            "Hover is not provided for a section",
            `[configuration]
  entity-expression = cpu_busy`,
            null,
            undefined,
            Position.create(0, "[conf".length),
        ),
        new Test(
            "Hover is provided for a setting containing whitespace",
            `[configuration]
  entity expression = cpu_busy`,
            {
                contents: "Apply server-side filter to all series based on entity names, tags, and fields.",
                range: Range.create(1, "  ".length, 1, "  ".length + "entity expression".length),
            },
            undefined,
            Position.create(1, "  entity expr".length),
        ),
        new Test(
            "Hover is provided if a space between setting name and equals sign is absent",
            `[configuration]
  entity expression= cpu_busy`,
            {
                contents: "Apply server-side filter to all series based on entity names, tags, and fields.",
                range: Range.create(1, "  ".length, 1, "  ".length + "entity expression".length),
            },
            undefined,
            Position.create(1, "  entity expr".length),
        ),
    ].forEach((test: Test): void => test.hoverTest());
});
