/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

import * as path from "path";
import { Extension, extensions, TextDocument, TextEditor, Uri, window, workspace } from "vscode";
import { appId } from "../util";

export let doc: TextDocument;
export let editor: TextEditor;
export let documentEol: string;
export let platformEol: string;

export async function activate(docUri: Uri) {
    // The extensionId is `publisher.name` from package.json
    console.log(appId);
    const ext: Extension<any> | undefined = extensions.getExtension(appId);
    if (ext) {
        await ext.activate();
        try {
            doc = await workspace.openTextDocument(docUri);
            editor = await window.showTextDocument(doc);
            await sleep(2000); // Wait for server activation
        } catch (e) {
            throw new Error(`Failed to activate extension ${e.message}`);
        }
    }
}

// tslint:disable-next-line:no-any
type TimeoutResolver = (...args: any[]) => void;

export async function sleep(ms: number): Promise<TimeoutResolver> {
    // tslint:disable-next-line:typedef
    return new Promise((resolve: TimeoutResolver) => setTimeout(resolve, ms));
}

export const getDocPath: (p: string) => string = (p: string): string =>
    path.resolve(__dirname, "../../testFixture", p);

export const getDocUri: (p: string) => Uri = (p: string): Uri =>
    Uri.file(getDocPath(p));
