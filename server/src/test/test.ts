import * as assert from "assert";
import { Diagnostic, FormattingOptions, Hover, Position, TextDocument, TextEdit } from "vscode-languageserver";
import { Formatter } from "../formatter";
import { HoverProvider } from "../hoverProvider";
import { JsDomCaller } from "../jsDomCaller";
import { Validator } from "../validator";

/**
 * Contains a test case and executes the test
 */
export class Test {
    /**
     * The expected result of the target function
     */
    private readonly expected: Diagnostic[] | TextEdit[] | Hover;
    /**
     * The name of the test. Displayed in tests list after the execution
     */
    private readonly name: string;
    /**
     * Formatting options used in Formatter tests
     */
    private readonly options?: FormattingOptions;
    /**
     * Position of Hover used in hover tests
     */
    private readonly position?: Position;
    /**
     * Text of the test document
     */
    private readonly text: string;
    private readonly document: TextDocument;

    public constructor(
        name: string,
        text: string,
        expected: Diagnostic[] | TextEdit[] | Hover,
        options?: FormattingOptions,
        position?: Position,
    ) {
        this.name = name;
        this.text = text;
        this.expected = expected;
        this.options = options;
        this.position = position;
        this.document = TextDocument.create("test", "axibasecharts", 1, text);
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
     * Tests Hover
     */
    public hoverTest(): void {
        test((this.name), () => {
            assert.deepStrictEqual(new HoverProvider(this.document).provideHover(this.position), this.expected);
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
