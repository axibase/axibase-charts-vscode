import {
    CompletionItem, CompletionItemKind, InsertTextFormat, Position, TextDocument,
} from "vscode-languageserver";
import { deleteComments, deleteScripts } from "./util";

/**
 * Provides dynamic completion items.
 */
export class CompletionProvider {
    private readonly text: string;

    public constructor(textDocument: TextDocument, position: Position) {
        const text: string = textDocument.getText().substr(0, textDocument.offsetAt(position));
        this.text = deleteScripts(deleteComments(text));
    }

    /**
     * Creates completion items
     */
    public getCompletionItems(): CompletionItem[] {
        return [this.completeFor()].concat(this.completeIf());
    }

    /**
     * Creates a completion item containing `for` loop.
     * `in` statement is generated based on previously declared lists and vars if any.
     * Variable name is generated based on `in` statement.
     * @returns completion item
     */
    private completeFor(): CompletionItem {
        const regexp: RegExp = /^[ \t]*(?:list|var)[ \t]+(\S+)[ \t]*=/mg;
        let match: RegExpExecArray | null = regexp.exec(this.text);
        let lastMatch: RegExpExecArray | undefined;

        while (match) {
            lastMatch = match;
            match = regexp.exec(this.text);
        }

        let collection: string = "collection";
        let item: string = "item";

        if (lastMatch) {
            collection = lastMatch[1];
            if (collection.endsWith("s")) {
                item = collection.substr(0, collection.lastIndexOf("s"));
            }
        }
        const completion: CompletionItem = CompletionItem.create("for");
        completion.insertText = `
for \${1:${item}} in \${2:${collection}}
  \${3:entity = @{\${1:${item}}}}
  \${0}
endfor`;
        completion.detail = "For loop";
        completion.kind = CompletionItemKind.Keyword;
        completion.insertTextFormat = InsertTextFormat.Snippet;

        return completion;
    }

    /**
     * Creates an array of completion items containing `if` statement.
     * Conditions are generated based on previously declared `for` loops.
     * @returns array containing variants of `if` statement
     */
    private completeIf(): CompletionItem[] {
        const regexp: RegExp = /^[ \t]*for[ \t]+(\w+)[ \t]+in/img;
        const endFor: RegExp = /^[ \t]*endfor/img;
        let match: RegExpExecArray | null = regexp.exec(this.text);
        let lastMatch: RegExpExecArray | undefined;

        while (match) {
            const end: RegExpExecArray | null = endFor.exec(this.text);
            if (!end || end.index < match.index) {
                lastMatch = match;
            }
            match = regexp.exec(this.text);
        }

        let item: string = "item";

        if (lastMatch) {
            item = lastMatch[1];
        }
        const ifString: CompletionItem = CompletionItem.create("if string");
        ifString.detail = "if item equals text";
        ifString.insertText = `
if @{\${1:${item}}} \${2:==} \${3:"item1"}
  \${4:entity} = \${5:"item2"}
else
  \${4:entity} = \${6:"item3"}
endif
\${0}`;

        const ifNumber: CompletionItem = CompletionItem.create("if number");
        ifNumber.insertText = `
if @{\${1:${item}}} \${2:==} \${3:5}
  \${4:entity} = \${5:"item1"}
else
  \${4:entity} = \${6:"item2"}
endif
\${0}`;
        ifNumber.detail = "if item equals number";

        const ifElseIf: CompletionItem = CompletionItem.create("if else if");
        ifElseIf.detail = "if item equals number else if";
        ifElseIf.insertText = `
if @{\${1:${item}}} \${2:==} \${3:5}
  \${4:entity} = \${5:"item1"}
elseif @{\${1:${item}}} \${6:==} \${7:6}
  \${4:entity} = \${8:"item2"}
else
  \${4:entity} = \${9:"item3"}
endif
\${0}`;

        return [ifString, ifNumber, ifElseIf].map((completion: CompletionItem): CompletionItem => {
            completion.insertTextFormat = InsertTextFormat.Snippet;
            completion.kind = CompletionItemKind.Keyword;

            return completion;
        });
    }
}
