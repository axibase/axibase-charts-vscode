import * as assert from "assert";
import { Diagnostic } from "vscode-languageserver";
import { JavaScriptValidator } from "../javaScriptValidator";

/**
 * Contains a test case and executes the test
 */
export class Test {
    /**
     * The expected result of the target function
     */
    private readonly expected: Diagnostic[];
    /**
     * The name of the test. Displayed in tests list after the execution
     */
    private readonly name: string;
    /**
     * Text of the test document
     */
    private readonly text: string;

    public constructor(
        name: string,
        text: string,
        expected: Diagnostic[],
    ) {
        this.name = name;
        this.text = text;
        this.expected = expected;
    }

    /**
     * Tests JavaScriptValidator (JavaScript statements, including var)
     */
    public jsValidationTest(): void {
        test((this.name), () => {
            assert.deepStrictEqual(new JavaScriptValidator(this.text).validate(true), this.expected);
        });
    }
}
