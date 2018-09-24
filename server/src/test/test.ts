import * as assert from "assert";
import { Diagnostic, FormattingOptions, TextEdit } from "vscode-languageserver";
import { Formatter } from "../formatter";
import { Validator } from "../validator";
import { JsDomCaller } from "../jsDomCaller";

/**
 * Contains a test case and executes the test
 */
export class Test {
    /**
     * The expected result of the target function
     */
    private readonly expected: Diagnostic[] | TextEdit[];
    /**
     * The name of the test. Displayed in tests list after the execution
     */
    private readonly name: string;
    /**
     * Formatting options used in Formatter tests
     */
    private readonly options: FormattingOptions | undefined;
    /**
     * Text of the test document
     */
    private readonly text: string;

    public constructor(name: string, text: string, expected: Diagnostic[] | TextEdit[], options?: FormattingOptions) {
        this.name = name;
        this.text = text;
        this.expected = expected;
        this.options = options;
    }

    /**
     * Tests Formatter
     */
    public formatTest(): void {
        test((this.name), () => {
            if (this.options === undefined) {
                throw new Error("We're trying to test formatter without formatting options");
            }
            assert.deepStrictEqual(new Formatter(this.text, this.options).lineByLine(), this.expected);
        });
    }

    /**
     * Tests Validator
     */
    public validationTest(): void {
        test((this.name), () => {
            assert.deepStrictEqual(new Validator(this.text).lineByLine(), this.expected);
        });
    }

    /**
     * Tests JsDomCaller (JavaScript statements, including var)
     */
    public jsValidationTest(): void {
        test((this.name), () => {
            assert.deepStrictEqual(new JsDomCaller(this.text).validate(true), this.expected);
        });
    }
}
