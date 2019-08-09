import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";

const DIAGNOSTIC_SOURCE: string = "Axibase Charts";

/**
 * Short-hand to create a diagnostic with undefined code and a standardized source
 * @param range Where is the mistake?
 * @param severity How severe is that problem?
 * @param message What message should be passed to the user?
 */
export function createDiagnostic(
    range: Range,
    message: string,
    severity: DiagnosticSeverity = DiagnosticSeverity.Error,
): Diagnostic {
    return Diagnostic.create(range, message, severity, undefined, DIAGNOSTIC_SOURCE);
}

/**
 * Replaces all comments with spaces.
 * We need to remember places of statements in the original configuration,
 * that's why it is not possible to delete all comments, whereas they must be ignored.
 * @param text the text to replace comments
 * @returns the modified text
 */
export function deleteComments(text: string): string {
    let content: string = text;
    const multiLine: RegExp = /\/\*[\s\S]*?\*\//g;
    const oneLine: RegExp = /^[ \t]*#.*/mg;
    let match: RegExpExecArray | null = multiLine.exec(content);
    if (match === null) {
        match = oneLine.exec(content);
    }

    while (match !== null) {
        const newLines: number = match[0].split("\n").length - 1;
        const spaces: string = Array(match[0].length)
            .fill(" ")
            .concat(Array(newLines).fill("\n"))
            .join("");
        content = `${content.substr(0, match.index)}${spaces}${content.substr(match.index + match[0].length)}`;
        match = multiLine.exec(content);
        if (match === null) {
            match = oneLine.exec(content);
        }
    }

    return content;
}
