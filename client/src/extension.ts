import { debounce } from "lodash";
import { join } from "path";
import {
    commands,
    ConfigurationChangeEvent,
    Diagnostic,
    DiagnosticCollection,
    ExtensionContext,
    languages, Position,
    Range,
    TextDocument,
    Uri,
    ViewColumn,
    WebviewPanel,
    window,
    workspace
} from "vscode";
import {
    ForkOptions, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind
} from "vscode-languageclient";
import { PanelContentProvider } from "./panelContentProvider";
const configSection: string = "axibaseCharts";
export const languageId: string = "axibasecharts";
let client: LanguageClient;

/**
 * Activates the extension
 * @param context the context of the extension
 */
export const activate: (context: ExtensionContext) => void = async (context: ExtensionContext): Promise<void> => {

    // Update WebviewPanel HTML on config change only if DEBOUNCE_TIME seconds have passed without it being updated.
    const DEBOUNCE_TIME = 5000; // 5s
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
        documentSelector: [{
            language: languageId,
            scheme: "file"
        }],
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
                .map(transformToClientDiagnostic);

            function transformToClientDiagnostic(d: Diagnostic) {
                const start = new Position(d.range.start.line, d.range.start.character);
                const end = new Position(d.range.end.line, d.range.end.character);
                return new Diagnostic(new Range(start, end), d.message, d.severity - 1);
            }

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

    let provider: PanelContentProvider | undefined;
    let panel: WebviewPanel | undefined;

    const debouncedUpdatePanelHTML = debounce(updatePanelHTMl, DEBOUNCE_TIME);

    function updatePanelHTMl(document?: TextDocument) {
        panel.webview.html = provider.getWebviewContent(document);
    }

    context.subscriptions.push(workspace.onDidChangeTextDocument((event: any) => {
        if (event.document.languageId === languageId && provider) {
            debouncedUpdatePanelHTML(event.document);
        }
    }));

    context.subscriptions.push(window.onDidChangeActiveTextEditor(() => {
        if (window.activeTextEditor &&
            window.activeTextEditor.document.languageId === languageId && provider) {
            updatePanelHTMl(window.activeTextEditor.document);
        }
    }));

    context.subscriptions.push(commands.registerCommand(`${languageId}.showPortal`, async (): Promise<void> => {
        if (!window.activeTextEditor) {
            return;
        }

        const document: TextDocument = window.activeTextEditor.document;
        if (document.languageId !== languageId) {
            return;
        }
        /**
         * One provider and one panel for all configs, only panel.webview.html is changed.
         */
        if (!provider) {
            provider = new PanelContentProvider(context.asAbsolutePath);
            await provider.setConnectionSettings();
            panel = window.createWebviewPanel(
                languageId,
                "Preview Portal",
                ViewColumn.Two,
                {
                    // Allow <script>s in the webview content.
                    enableScripts: true,
                    // Allow the access to resources only in extension's resources directory.
                    localResourceRoots: [provider.getUri("resources")]
                }
            );
            panel.onDidDispose(
                () => {
                    provider = null;
                    panel = null;
                    debouncedUpdatePanelHTML.cancel();
                },
                null,
                context.subscriptions
            );
        }
        updatePanelHTMl(document);
    }));

    context.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent): Promise<void> => {
            if (e.affectsConfiguration(configSection) && provider) {
                const answer: string | undefined =
                    await window.showInformationMessage("Current connection details were modified.", "Reload");
                if (answer === "Reload") {
                    await provider.setConnectionSettings();
                    updatePanelHTMl();
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
