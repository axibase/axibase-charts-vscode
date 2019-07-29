import { ok, strictEqual } from "assert";
import {
    commands,
    Diagnostic,
    languages,
    Position,
    TextDocument,
    TextEditorEdit,
    Uri,
    window,
    workspace,
} from "vscode";
import { getDocUri, sleep } from "../helper";

suite("Should diagnostics", () => {
    test("display actual count of diagnostic messages when open", async () => {
        const docUri: Uri = getDocUri("simple.config");
        const document: TextDocument = await workspace.openTextDocument(docUri);
        await window.showTextDocument(document);
        await sleep(6000);
        const actualDiagnostic: Diagnostic[] = languages.getDiagnostics(docUri);
        strictEqual(actualDiagnostic.length, 2, "Incorrect number of messages for file");
        await commands.executeCommand("workbench.action.closeActiveEditor");
    });

    test("clear messages after close", async () => {
        const docUri: Uri = getDocUri("simple.config");
        const document: TextDocument = await workspace.openTextDocument(docUri);
        await window.showTextDocument(document);
        await sleep(4000);
        await commands.executeCommand("workbench.action.closeActiveEditor");
        await sleep(500);
        const actualDiagnostic: Diagnostic[] = languages.getDiagnostics(docUri);
        strictEqual(actualDiagnostic.length, 0);
    });

    test("clear messages after close with dirty files", async () => {
        const docUri: Uri = getDocUri("simple.config");
        const document: TextDocument = await workspace.openTextDocument(docUri);
        await window.showTextDocument(document);
        await sleep(4000);
        const isEdited: boolean = await window.activeTextEditor.edit((editBuilder: TextEditorEdit) =>
            editBuilder.insert(new Position(0, 0), " "));
        ok(isEdited);
        await commands.executeCommand("workbench.action.closeActiveEditor");
        const actualDiagnostic: Diagnostic[] = languages.getDiagnostics(docUri);
        strictEqual(actualDiagnostic.length, 0);
    });
});
