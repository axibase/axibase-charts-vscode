import { Test } from "./test";

suite("[property] section tests", () => {
    new Test(
        "Correct: any value can be assigned to type",
        `[widget]
        type = property
        [property]
            type = cpu`, [],
    ).validationTest();
});
