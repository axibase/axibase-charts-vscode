import { join } from "path";
// tslint:disable-next-line:no-require-imports
import urlRegex = require("url-regex");
import {
    commands, Disposable, ExtensionContext, TextDocument, Uri, ViewColumn, window, workspace, WorkspaceConfiguration,
} from "vscode";
import {
    ForkOptions, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind,
} from "vscode-languageclient";
import { AxibaseChartsProvider } from "./axibaseChartsProvider";

let client: LanguageClient;

export const activate: (context: ExtensionContext) => void = async (context: ExtensionContext): Promise<void> => {

    // The server is implemented in node
    const serverModule: string = context.asAbsolutePath(join("server", "out", "server.js"));
    // The debug options for the server
    const debugOptions: ForkOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    const tabSize: number = 2;
    const configuration: WorkspaceConfiguration = workspace.getConfiguration("editor");
    configuration.update("tabSize", tabSize);
    configuration.update("insertSpaces", true);

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        debug: { module: serverModule, options: debugOptions, transport: TransportKind.ipc },
        run: { module: serverModule, transport: TransportKind.ipc },
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ language: "axibasecharts", scheme: "file" }],
        outputChannelName: "Axibase Charts",
        synchronize: {
            // Notify the server about file changes to ".clientrc files contain in the workspace
            fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
        },
    };

    // Create the language client and start the client.
    client = new LanguageClient("axibaseCharts", "Axibase Charts", serverOptions, clientOptions);

    // Start the client. This will also launch the server
    client.start();
    const previewUri: string = "axibaseCharts://authority/axibaseCharts";
    let provider: AxibaseChartsProvider | undefined;
    const saveListener: Disposable = workspace.onDidSaveTextDocument((document: TextDocument) => {
        if (window.activeTextEditor && document.uri === window.activeTextEditor.document.uri && provider) {
            provider.update(Uri.parse(previewUri));
        }
    });
    const changeListener: Disposable = window.onDidChangeActiveTextEditor(() => {
        if (provider) {
            provider.update(Uri.parse(previewUri));
        }
    });
    const showCommand: Disposable = commands.registerCommand("axibasecharts.showPortal", async (): Promise<void> => {
        if (!provider) {
            let url: string | undefined = configuration.get("url");
            if (!url) {
                try {
                    url = await askUrl();
                } catch (err) {
                    return Promise.reject(err);
                }
            }
            let username: string | undefined = configuration.get("username");
            if (!username) {
                try {
                    username = await window.showInputBox({
                        ignoreFocusOut: true, placeHolder: "username",
                        prompt:
                            "Specify only if API is closed for guests. Value can be stored in 'axibaseCharts.username'",
                    });
                } catch (err) {
                    username = undefined;
                }
            }
            let password: string | undefined;
            if (username) {
                try {
                    password = await window.showInputBox({
                        ignoreFocusOut: true, password: true,
                        prompt: "Please, enter the password. Can not be stored",
                    });
                } catch (err) {
                    password = undefined;
                }
            }
            provider = new AxibaseChartsProvider(url, username, password);
            context.subscriptions.push(workspace.registerTextDocumentContentProvider("axibaseCharts", provider));
            provider.update(Uri.parse(previewUri));
        }

        commands.executeCommand("vscode.previewHtml", previewUri, ViewColumn.Two, "Portal");
    });
    const changeCommand: Disposable = commands.registerCommand("axibasecharts.changeUrl", (): void => {
        provider = undefined;
        commands.executeCommand("axibasecharts.showPortal");
    });
    context.subscriptions.push(showCommand, saveListener, changeListener, changeCommand);
};

export const deactivate: () => Thenable<void> = (): Thenable<void> => {
    if (!client) {
        return Promise.resolve();
    }

    return client.stop();
};

const validateUrl: (url: string) => boolean = (url: string): boolean => urlRegex({ exact: true, strict: true })
    .test(url);
const validateAddress: (address: string) => string | undefined = (address: string): string | undefined => {
    const regex: RegExp = urlRegex({ exact: true, strict: false });
    if (!regex.test(address)) {
        return "The address is invalid";
    }

    return undefined;
};

const askUrl: () => Promise<string> = async (): Promise<string> => {
    const protocol: string | undefined = await window.showQuickPick(["http", "https"], {
        canPickMany: false, ignoreFocusOut: true, placeHolder: "Choose the protocol to connect to ATSD",
    });
    if (!protocol) {
        return Promise.reject("Protocol is not specified");
    }
    const address: string | undefined = await window.showInputBox({
        ignoreFocusOut: true, placeHolder: "localhost",
        prompt: "Enter the target ATSD address. Can be stored permanently in 'axibaseCharts.url' setting",
        validateInput: validateAddress,
    });
    if (!address) {
        return Promise.reject("Address is not specified");
    }
    const port: string | undefined = await window.showInputBox({
        ignoreFocusOut: true, placeHolder: "8443", prompt: "Enter the target ATSD port",
        validateInput: isPort, value: "8443",
    });
    if (!port) {
        return Promise.reject("Port is not specified");
    }
    const url: string = `${protocol}://${address}:${port}`;

    if (!validateUrl(url)) {
        window.showErrorMessage(`The specified URL: ${url} is incorrect!`);

        return askUrl();
    }

    return url;
};

const isPort: (str: string) => string | undefined = (str: string): string | undefined => {
    const port: number = Number.parseInt(str, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
        return "Port must be an integer between 1 and 65535";
    }

    return undefined;
};
