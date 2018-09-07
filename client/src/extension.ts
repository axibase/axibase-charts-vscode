import { join } from "path";
// tslint:disable-next-line:no-require-imports
import urlRegex = require("url-regex");
import {
    commands, ConfigurationChangeEvent, Disposable, ExtensionContext, TextDocument, Uri, ViewColumn,
    window, workspace, WorkspaceConfiguration,
} from "vscode";
import {
    ForkOptions, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind,
} from "vscode-languageclient";
import { AxibaseChartsProvider } from "./axibaseChartsProvider";

const previewUri: string = "axibaseCharts://authority/axibaseCharts";
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
        if (window.activeTextEditor && document.uri === window.activeTextEditor.document.uri && provider) {
            provider.update(Uri.parse(previewUri));
        }
    }));
    context.subscriptions.push(window.onDidChangeActiveTextEditor(() => {
        if (window.activeTextEditor && window.activeTextEditor.document.languageId === languageId && provider) {
            provider.update(Uri.parse(previewUri));
        }
    }));
    let providerRegistration: Disposable | undefined;
    context.subscriptions.push(commands.registerCommand(`${languageId}.showPortal`, async (): Promise<void> => {
        if (!provider) {
            try {
                provider = await constructProvider();
            } catch (err) {
                window.showErrorMessage(err);

                return Promise.reject();
            }

            providerRegistration = workspace.registerTextDocumentContentProvider("axibaseCharts", provider);
            context.subscriptions.push(providerRegistration);
            provider.update(Uri.parse(previewUri));
        }

        commands.executeCommand("vscode.previewHtml", previewUri, ViewColumn.Two, "Portal");
    }));
    context.subscriptions.push(workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent): void => {
        if (e.affectsConfiguration(configSection) && providerRegistration && provider) {
            context.subscriptions.splice(context.subscriptions.indexOf(providerRegistration), 1);
            providerRegistration.dispose();
            provider = undefined;
        }
    }));
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

const constructProvider: () => Promise<AxibaseChartsProvider> = async (): Promise<AxibaseChartsProvider> => {
    const config: WorkspaceConfiguration = workspace.getConfiguration(configSection);
    const protocol: string | undefined = config.get("protocol");
    if (!protocol) {
        return Promise.reject(errorMessage);
    }
    const address: string | undefined = config.get("address");
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
            return Promise.reject(err);
        }
    }

    return new AxibaseChartsProvider(url, username, password);
};
