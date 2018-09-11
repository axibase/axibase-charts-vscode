import { ClientRequest, IncomingMessage, OutgoingMessage, request as http } from "http";
import { request as https, RequestOptions } from "https";
import { join } from "path";
import { URL } from "url";
// tslint:disable-next-line:no-require-imports
import urlRegex = require("url-regex");
import {
    commands, ConfigurationChangeEvent, ExtensionContext, TextDocument, ViewColumn,
    window, workspace, WorkspaceConfiguration,
} from "vscode";
import {
    ForkOptions, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind,
} from "vscode-languageclient";
import { AxibaseChartsProvider, IConnectionDetails } from "./axibaseChartsProvider";

const configSection: string = "axibaseCharts";
export const languageId: string = "axibasecharts";
const errorMessage: string = "Configure connection properties in VSCode > Preferences > Settings. Open Settings," +
    " search settings for 'axibase', and enter the requested connection properties.";
let client: LanguageClient;

export const activate: (context: ExtensionContext) => void = async (context: ExtensionContext): Promise<void> => {

    // The server is implemented in node
    const serverModule: string = context.asAbsolutePath(join("server", "out", "server.js"));
    // The debug options for the server
    const debugOptions: ForkOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

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
        if (!window.activeTextEditor) {
            return Promise.resolve();
        }
        const document: TextDocument = window.activeTextEditor.document;
        if (document.languageId !== languageId) {
            return Promise.resolve();
        }
        if (!provider) {
            let details: IConnectionDetails;
            try {
                details = await constructConnection();
            } catch (err) {
                window.showErrorMessage((err as Error).toString());

                return Promise.resolve();
            }
            provider = new AxibaseChartsProvider(details, document);

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
                        window.showErrorMessage((err as Error).toString());

                        return Promise.resolve();
                    }
                    provider.changeSettings(details);

                    return Promise.resolve();
                }
            }
        }),
    );
};

export const deactivate: () => Thenable<void> = (): Thenable<void> => {
    if (!client) {
        return Promise.resolve();
    }

    return client.stop();
};

const validateUrl: (url: string) => boolean = (url: string): boolean =>
    urlRegex({ exact: true, strict: true })
        .test(url);

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
    if (!validateUrl(url)) {
        return Promise.reject(`"${url}" is invalid`);
    }

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

    let cookie: string | undefined;
    if (password && username) {
        try {
            cookie = await performRequest(url, username, password);
        } catch (err) {
            return Promise.reject(err as Error);
        }
    }

    return { url, cookie };
};
const performRequest: (address: string, username: string, password: string) => Promise<string> =
    async (address: string, username: string, password: string): Promise<string> => {
        const url: URL = new URL(address);
        const options: RequestOptions = {
            headers: {
                Authorization: `Basic ${new Buffer(`${username}:${password}`).toString("base64")}`,
            },
            hostname: url.hostname,
            method: "GET",
            path: "/api/v1/ping",
            port: url.port,
            protocol: url.protocol,
            rejectUnauthorized: false, // allows self-signed certificates
            timeout: 3000, // milliseconds (3 s)
        };
        const request: (options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void)
            => ClientRequest = (url.protocol === "https:") ? https : http;

        return new Promise<string>((resolve: (result: string) => void, reject: (err: Error) => void): void => {
            const outgoing: OutgoingMessage = request(options, (res: IncomingMessage) => {
                res.on("error", reject);
                if (res.statusCode !== 200) {
                    return reject(new Error(`Login failed with status code ${res.statusCode}`));
                }
                const cookies: string[] | undefined = res.headers["set-cookie"];
                if (!cookies || cookies.length < 1) {
                    return reject(new Error("Cookie is empty"));
                }
                let result: string = "";
                for (const cookie of cookies) {
                    result += `document.cookie = '${cookie}';\n`;
                }
                resolve(result);
            });

            outgoing.on("error", reject);
            outgoing.end();
        });
    };
