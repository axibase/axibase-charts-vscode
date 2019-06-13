import {
    ClientCapabilities, CompletionItem, CompletionParams, createConnection, Diagnostic,
    DidChangeConfigurationNotification, DidChangeConfigurationParams,
    DocumentFormattingParams, Hover, IConnection, InitializeParams,
    ProposedFeatures, TextDocument, TextDocumentChangeEvent, TextDocumentPositionParams, TextDocuments, TextEdit,
} from "vscode-languageserver";
import { CompletionProvider } from "./completionProvider";
import { Formatter } from "./formatter";
import { HoverProvider } from "./hoverProvider";
import { JavaScriptValidator } from "./javaScriptValidator";
import { ResourcesProvider } from "./resourcesProvider";
import { Validator } from "./validator";

// Create a connection for the server. The connection uses Node"s IPC as a transport.
// Also include all preview / proposed LSP features.
const connection: IConnection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean | undefined = false;

connection.onInitialize((params: InitializeParams) => {
    const capabilities: ClientCapabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    // If not, we will fall back using global settings
    hasConfigurationCapability = capabilities.workspace && !!capabilities.workspace.configuration;

    return {
        capabilities: {
            completionProvider: { resolveProvider: true },
            documentFormattingProvider: true,
            hoverProvider: true,
            textDocumentSync: documents.syncKind,
        },
    };
});

connection.onInitialized(() => {
    if (hasConfigurationCapability === true) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
});

connection.onHover((params: TextDocumentPositionParams): Hover => {
    const document: TextDocument = documents.get(params.textDocument.uri);

    return new HoverProvider(document).provideHover(params.position);
});

interface IServerSettings {
    validateFunctions: boolean;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
const defaultSettings: IServerSettings = { validateFunctions: false };
let globalSettings: IServerSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<IServerSettings>> = new Map();

const getDocumentSettings: (resource: string) => Thenable<IServerSettings> =
    (resource: string): Thenable<IServerSettings> => {
        // can be undefined too
        if (hasConfigurationCapability !== true) {
            return Promise.resolve(globalSettings);
        }
        let result: Thenable<IServerSettings> | undefined = documentSettings.get(resource);
        if (result === undefined) {
            result = connection.workspace.getConfiguration({
                scopeUri: resource,
                section: "axibaseCharts",
            });
            documentSettings.set(resource, result);
        }

        return result;
    };

// Only keep settings for open documents
documents.onDidClose((e: TextDocumentChangeEvent) => {
    documentSettings.delete(e.document.uri);
});

const validateTextDocument: (textDocument: TextDocument) => Promise<void> =
    async (textDocument: TextDocument): Promise<void> => {
        const settings: IServerSettings = await getDocumentSettings(textDocument.uri);
        const text: string = textDocument.getText();
        const validator: Validator = new Validator(text);
        const jsValidator: JavaScriptValidator = new JavaScriptValidator(text);
        const diagnostics: Diagnostic[] = validator.lineByLine();
        const jsDiagnostics: Diagnostic[] = jsValidator.validate(settings.validateFunctions);

        // Send the computed diagnostics to VSCode.
        // connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
        connection.sendNotification("charts-diagnostic", [textDocument.uri, diagnostics.concat(jsDiagnostics)]);
    };

connection.onDidChangeConfiguration((change: DidChangeConfigurationParams) => {
    if (hasConfigurationCapability === true) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        globalSettings = (change.settings.axibaseCharts == null) ? defaultSettings : change.settings.axibaseCharts;
    }

    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});

documents.onDidChangeContent(async (change: TextDocumentChangeEvent) => {
    await validateTextDocument(change.document);
});

connection.onDocumentFormatting((params: DocumentFormattingParams): TextEdit[] => {
    const document: TextDocument | undefined = documents.get(params.textDocument.uri);
    if (document === undefined) {
        return [];
    }
    const text: string | undefined = document.getText();
    const formatter: Formatter = new Formatter(text, params.options);

    return formatter.lineByLine();
});

connection.onCompletion((params: CompletionParams): CompletionItem[] => {
    const textDocument: TextDocument | undefined = documents.get(params.textDocument.uri);
    if (textDocument === undefined) {
        return [];
    }

    const completionProvider: CompletionProvider = new CompletionProvider(
        textDocument, params.position, new ResourcesProvider().settingsMap
    );

    return completionProvider.getCompletionItems();
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => item);

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();
