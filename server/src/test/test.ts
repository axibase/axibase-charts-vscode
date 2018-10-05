import * as assert from "assert";
import { Diagnostic, FormattingOptions, Hover, Position, TextDocument, TextEdit } from "vscode-languageserver";
import { Formatter } from "../formatter";
import { HoverProvider } from "../hoverProvider";
import { JavaScriptValidator } from "../javaScriptValidator";
import { SectionStack } from "../sectionStack";
import { TextRange } from "../textRange";
import { Validator } from "../validator";
import { CompletionProvider } from "../completionProvider";

/**
 * Stub section validator to allow incomplete configs in tests
 */
// tslint:disable-next-line:no-object-literal-type-assertion
const sectionStackStub: SectionStack  = {
    insertSection(_section: TextRange): Diagnostic | null {
        return null;
    },

    finalize(): Diagnostic | null {
        return null;
    }
} as SectionStack;

/**
 * Contains a test case and executes the test
 */
export class Test {
    /**
     * The expected result of the target function
     */
    private readonly expected: Diagnostic[] | TextEdit[] | Hover | string[];
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
        expected: Diagnostic[] | TextEdit[] | Hover | string[],
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
            let validator = new Validator(this.text);
            Object.assign(validator, { sectionStack: sectionStackStub });
            assert.deepStrictEqual(validator.lineByLine(), this.expected);
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
            assert.deepStrictEqual(new JavaScriptValidator(this.text).validate(true), this.expected);
        });
    }

    /**
     * Tests CompletionProvider
     */
    public completionTest(): void {
        test((this.name), () => {
            assert.deepStrictEqual(new CompletionProvider(this.document, this.position).getCompletionItems().map(i => {
                return i.insertText;
            }),
                this.expected);
        });
    }
}
