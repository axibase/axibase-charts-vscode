import {
    ClientRequest,
    IncomingMessage,
    OutgoingHttpHeaders,
    request as http,
} from "http";
import { request as https, RequestOptions } from "https";
import { join } from "path";
import { URL } from "url";
import {
    commands,
    ConfigurationChangeEvent,
    Diagnostic,
    DiagnosticCollection,
    ExtensionContext,
    languages,
    TextDocument,
    Uri,
    ViewColumn,
    window,
    workspace,
    WorkspaceConfiguration,
} from "vscode";
import {
    ForkOptions, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind,
} from "vscode-languageclient";
import { AxibaseChartsProvider, IConnectionDetails } from "./axibaseChartsProvider";
import { statusFamily, StatusFamily, userAgent } from "./util";

const configSection: string = "axibaseCharts";
export const languageId: string = "axibasecharts";
const errorMessage: string = "Configure connection properties in VSCode > Preferences > Settings. Open Settings," +
    " search settings for 'axibase', and enter the requested connection properties.";
let client: LanguageClient;

/**
 * Activates the extension
 * @param context the context of the extension
 */
export const activate: (context: ExtensionContext) => void = async (context: ExtensionContext): Promise<void> => {

    // The server is implemented in node
    const serverModule: string = context.asAbsolutePath(join("server", "out", "server.js"));
    // The debug options for the server
    const debugOptions: ForkOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    const diagnosticCollection: DiagnosticCollection = languages.createDiagnosticCollection();

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        debug: { module: serverModule, options: debugOptions, transport: TransportKind.ipc },
        run: { module: serverModule, transport: TransportKind.ipc },
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ language: languageId, scheme: "file" }],
        outputChannelName: "Axibase Charts",
        synchronize: {
            // Notify the server about file changes to ".clientrc files contain in the workspace
            fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
        },
    };

    // Create the language client and start the client.
    client = new LanguageClient(languageId, "Axibase Charts", serverOptions, clientOptions);
    client.onReady().then(() => {
        client.onNotification("charts-diagnostic", (uri: string, serverDiagnostic: Diagnostic[]) => {
            // There are differ in severity levels on language server and client.
            // The severity should be normalized.
            const normalizedDiagnostic: Diagnostic[] = serverDiagnostic
                .map((d: Diagnostic) =>
                    new Diagnostic(d.range, d.message, d.severity - 1));
            const validatedDocUri: Uri = Uri.parse(uri);
            const validatedDoc: TextDocument | undefined = workspace.textDocuments
                .find((doc: TextDocument) => !doc.isClosed && doc.uri.fsPath === validatedDocUri.fsPath);
            if (validatedDoc) {
                diagnosticCollection.set(validatedDoc.uri, normalizedDiagnostic);
            }
        });
    });

    workspace.onDidCloseTextDocument((textDocument: TextDocument) => {
        const uri: Uri = Uri.file(textDocument.uri.fsPath);
        if (textDocument.uri.scheme === "git") {
            const sourcePath: string = textDocument.fileName.replace(".git", "");
            const sourceUri: Uri = Uri.file(sourcePath);
            diagnosticCollection.delete(sourceUri);
        }
        diagnosticCollection.delete(uri);
    });

    // Start the client. This will also launch the server
    client.start();

    let provider: AxibaseChartsProvider | undefined;
    context.subscriptions.push(workspace.onDidSaveTextDocument((document: TextDocument) => {
        if (provider && provider.document.uri === document.uri) {
            provider.update();
        }
    }));
    context.subscriptions.push(window.onDidChangeActiveTextEditor(() => {
        if (window.activeTextEditor && window.activeTextEditor.document.languageId === languageId && provider) {
            provider.document = window.activeTextEditor.document;
        }
    }));
    context.subscriptions.push(commands.registerCommand(`${languageId}.showPortal`, async (): Promise<void> => {
        if (!provider) {
            if (!window.activeTextEditor) {
                return Promise.resolve();
            }
            const document: TextDocument = window.activeTextEditor.document;
            if (document.languageId !== languageId) {
                return Promise.resolve();
            }
            let details: IConnectionDetails;
            try {
                details = await constructConnection();
            } catch (err) {
                window.showErrorMessage(err);

                return Promise.resolve();
            }
            provider = new AxibaseChartsProvider(details, document, context.asAbsolutePath);

            context.subscriptions.push(workspace.registerTextDocumentContentProvider("axibaseCharts", provider));
            provider.update();
        }

        commands.executeCommand("vscode.previewHtml", AxibaseChartsProvider.previewUri, ViewColumn.Two, "Portal");
    }));
    context.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent): Promise<void> => {
            if (e.affectsConfiguration(configSection) && provider) {
                const answer: string | undefined =
                    await window.showInformationMessage("Current connection details were modified.", "Reload");
                if (answer === "Reload") {
                    let details: IConnectionDetails;
                    try {
                        details = await constructConnection();
                    } catch (err) {
                        window.showErrorMessage(err);

                        return Promise.resolve();
                    }
                    provider.changeSettings(details);

                    return Promise.resolve();
                }
            }
        }),
    );
};

/**
 * Deactivates the extension
 */
export const deactivate: () => Thenable<void> = (): Thenable<void> => {
    if (!client) {
        return Promise.resolve();
    }

    return client.stop();
};

/**
 * Constructs connection details based on the extension configuration and an input box
 */
const constructConnection: () => Promise<IConnectionDetails> = async (): Promise<IConnectionDetails> => {
    const config: WorkspaceConfiguration = workspace.getConfiguration(configSection);
    const protocol: string | undefined = config.get("protocol");
    if (!protocol) {
        return Promise.reject(errorMessage);
    }
    const address: string | undefined = config.get("hostname");
    if (!address) {
        return Promise.reject(errorMessage);
    }
    const port: number | undefined = config.get("port");
    if (!port) {
        return Promise.reject(errorMessage);
    }
    const url: string = `${protocol}://${address}:${port}`;
    let password: string | undefined;
    const username: string | undefined = config.get("username");
    if (username) {
        try {
            password = await window.showInputBox({
                ignoreFocusOut: true, password: true,
                prompt: `Enter the password for user ${username} to connect ` +
                    `to ${address}:${port}. Exit VSCode to terminate the session.`,
            });
        } catch (err) {
            return Promise.reject(err as Error);
        }
    }

    let cookie: string[] | undefined;
    let atsd: boolean | undefined;
    try {
        [cookie, atsd] = await performRequest(url, username, password);
    } catch (err) {
        const error: Error = err as Error;
        window.showErrorMessage(error.toString());

        return Promise.reject(error);
    }
    window.showInformationMessage(`Connected to ${address}:${port} ${username ? `as ${username}` : ""}`);
    atsd = atsd === undefined ? true : atsd;

    return { url, cookie, atsd };
};

/**
 * Gets the cookies for a user from the server and tests if it ATSD or not
 * @param address the target server's URL address
 * @param username the target user's username
 * @param password the target user's password
 */
function performRequest(address: string, username?: string, password?: string): Promise<[string[], boolean]> {
    const timeout: number = 3000; // milliseconds (3 s)
    const url: URL = new URL(address);
    const headers: OutgoingHttpHeaders = (username && password) ? {
        "Authorization": `Basic ${new Buffer(`${username}:${password}`).toString("base64")}`,
        "user-agent": userAgent,
    } : {
            "user-agent": userAgent,
        };

    const options: RequestOptions = {
        hostname: url.hostname,
        method: "GET",
        path: (username && password) ? "/api/v1/ping" : "",
        port: url.port,
        protocol: url.protocol,
        rejectUnauthorized: false, // allows self-signed certificates
        timeout,
    };
    options.headers = headers;
    const request: (options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void)
        => ClientRequest = (url.protocol === "https:") ? https : http;

    return new Promise<[string[], boolean]>(
        (resolve: (result: [string[], boolean]) => void, reject: (err: Error) => void): void => {
            const clientRequest: ClientRequest = request(options, (res: IncomingMessage) => {
                handleResponse(res, resolve, reject);
            });
            clientRequest.on("socket", () => {
                clientRequest.setTimeout(timeout);
            });
            clientRequest.on("timeout", () => {
                clientRequest.abort();
                reject(new Error("The request has exceeded the timeout"));
            });
            clientRequest.on("error", reject);
            clientRequest.end();
        },
    );
}

/**
 * Processes the incoming message
 * @param res the incoming message
 * @param resolve callback on success
 * @param reject callback on error
 */
function handleResponse(
    res: IncomingMessage,
    resolve: (result: [string[], boolean]) => void,
    reject: (err: Error) => void,
): void {
    res.on("error", reject);
    const family: StatusFamily = statusFamily(res.statusCode);
    if (family === StatusFamily.CLIENT_ERROR || family === StatusFamily.SERVER_ERROR) {
        if (res.statusCode === 401) {
            return reject(new Error(`Login failed with status code ${res.statusCode}`));
        } else {
            return reject(new Error(`Unexpected Response Code ${res.statusCode}`));
        }
    }
    const cookies: string[] | undefined = res.headers["set-cookie"];
    if (!cookies || cookies.length < 1) {
        return reject(new Error("Cookie is empty"));
    }
    const server: string | string[] | undefined = res.headers.server;
    let atsd: boolean;
    if (!server || Array.isArray(server)) {
        atsd = false;
    } else {
        const lowerCased: string = server.toLowerCase();
        atsd = lowerCased.includes("atsd");
    }
    resolve([cookies, atsd]);
}
