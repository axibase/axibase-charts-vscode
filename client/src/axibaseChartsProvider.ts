import { join } from "path";
import {
    Event, EventEmitter, TextDocument, TextDocumentContentProvider, Uri, workspace,
} from "vscode";
import { languageId } from "./extension";

export interface IConnectionDetails {
    atsd: boolean;
    cookie?: string[];
    url: string;
}

export class AxibaseChartsProvider implements TextDocumentContentProvider {
    /**
     * Sets the working document and fires update() event
     */
    public set document(document: TextDocument) {
        this.innerDocument = document;
        this.update();
    }

    public get document(): TextDocument {
        return this.innerDocument;
    }

    public get onDidChange(): Event<Uri> {
        return this.onDidChangeEmitter.event;
    }

    public static readonly previewUri: Uri = Uri.parse("axibaseCharts://authority/axibaseCharts");
    private readonly absolutePath: (path: string) => string;

    private atsd!: boolean;
    private innerDocument: TextDocument;
    private jsessionid: string | undefined;
    private readonly onDidChangeEmitter: EventEmitter<Uri>;
    private text: string | undefined;
    private url!: string;

    public constructor(details: IConnectionDetails, document: TextDocument,
                       absolutePath: (path: string) => string) {
        if (document.languageId !== languageId) {
            throw new Error("Incorrect language");
        }
        this.onDidChangeEmitter = new EventEmitter<Uri>();
        this.innerDocument = document;
        this.updateSettings(details);
        this.absolutePath = absolutePath;
    }

    /**
     * Applies the new settings to the current preview
     * @param details new settings
     */
    public changeSettings(details: IConnectionDetails): void {
        this.updateSettings(details);
        this.update();
    }

    /**
     * Provides html code to preview the configuration
     */
    public provideTextDocumentContent(): string {
        this.text = deleteComments(this.innerDocument.getText());
        this.clearUrl();
        this.replaceImports();

        this.addUrl();
        const html: string = this.getHtml();

        return html;
    }

    /**
     * Fires onDidChange to inform all listeners
     */
    public update(): void {
        this.onDidChangeEmitter.fire(AxibaseChartsProvider.previewUri);
    }

    /**
     * Adds `url = ...` to the configuration
     */
    private addUrl(): void {
        if (!this.text) {
            this.text = "[configuration]";
        }
        let match: RegExpExecArray | null = /^[ \t]*\[configuration\]/mi.exec(this.text);
        if (match === null) {
            match = /\S/.exec(this.text);
            if (match === null) {
                return;
            }
            this.text = `${this.text.substr(0, match.index - 1)}[configuration]\n  ${this.text.substr(match.index)}`;
            match = /^[ \t]*\[configuration\]/i.exec(this.text);
        }
        if (match) {
            this.text = `${this.text.substr(0, match.index + match[0].length + 1)}  url = ${this.url}
${this.text.substr(match.index + match[0].length + 1)}`;
        }
    }

    /**
     * Trims, lower-cases and removes an extra '/' symbol
     * For example, `https://axiBase.com/ ` becomes `https://axibase.com`
     */
    private clearUrl(): void {
        this.url = this.url.trim()
            .toLowerCase();
        const match: RegExpExecArray | null = /\/+$/.exec(this.url);
        if (match) {
            this.url = this.url.substr(0, match.index);
        }
    }

    /**
     * Generates the path to a resource on the local filesystem
     * @param resource path to a resource
     */
    private extensionPath(resource: string): string {
        return this.absolutePath(join("client", resource));
    }

    /**
     * Creates the html from a configuration of a portal
     */
    private getHtml(): string {
        const theme: string | undefined = workspace.getConfiguration("workbench")
            .get("colorTheme");
        let darkTheme: string = "";
        if (theme && /[Bb]lack|[Dd]ark|[Nn]ight/.test(theme)) {
            darkTheme = `<link rel="stylesheet"
            href="${this.extensionPath("resources/css/black.css")}">`;
        }

        return `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="${this.extensionPath("resources/css/jquery-ui-1.9.1.custom.min.css")}">
    <link rel="stylesheet" href="${this.resource("charts.min.css")}">
    ${darkTheme}
	<style>
	  .portalPage body {
		padding: 0;
		background: var(--vscode-editor-background);
	  }
	</style>
	<script>
	    window.previewOptions = ${JSON.stringify({
            jsessionid: this.jsessionid,
            text: this.text,
            url: this.url,
        })};
	</script>
	<script src="${this.resource("portal_init.js")}"></script>
	<script src="${this.extensionPath("resources/js/config_init.js")}"></script>
	<script src="${this.extensionPath("resources/js/jquery-1.8.2.min.js")}"></script>
	<script src="${this.extensionPath("resources/js/jquery-ui-1.9.0.custom.min.js")}"></script>
	<script src="${this.extensionPath("resources/js/d3.min.js")}"></script>
	<script src="${this.resource("charts.min.js")}"></script>
	<script src="${this.extensionPath("resources/js/highlight.pack.js")}"></script>
	<script src="${this.extensionPath("resources/js/init.js")}"></script>
    </head>
    <body onload="initChart()">
        <div class="portalView"></div>
        <div id="dialog"></div>
    </body>
    </html>`;
    }

    /**
     * Adds the ATSD URL to the import statements
     * For example, `import fred = fred.js` becomes
     * `import fred = https://nur.axibase.com/portal/resource/scripts/fred.js`
     */
    private replaceImports(): void {
        if (!this.text) {
            this.text = "";
        }
        const address: string = (/\//.test(this.url)) ? `${this.url}/portal/resource/scripts/` : this.url;
        const regexp: RegExp = /(^\s*import\s+\S+\s*=\s*)(\S+)\s*$/mg;
        const urlPosition: number = 2;
        let match: RegExpExecArray | null = regexp.exec(this.text);
        while (match) {
            const external: string = match[urlPosition];
            if (!/\//.test(external)) {
                this.text = this.text.substr(0, match.index + match[1].length) +
                    address + external + this.text.substr(match.index + match[0].length);
            }
            match = regexp.exec(this.text);
        }
    }

    /**
     * Generates the path to a resource.
     * @param resource name of a static resource
     * @param isCss is this resource CSS file. If is not specified, the decides based on the file extension
     * @param isLocal should this resource be downloaded from the target server
     */
    private resource(resource: string, isCss?: boolean, isLocal: boolean = false): string {
        const jsPath: string = `${this.url}/${this.atsd ? "web/js/portal" : "JavaScript/portal/JavaScript"}`;
        const cssPath: string = `${this.url}/${this.atsd ? "web/css/portal" : "JavaScript/portal/CSS"}`;
        const cssType: boolean | undefined = (isCss === undefined) ? /.*\.css$/.test(resource) : isCss;
        const resourcePath: string =
            isLocal ? this.extensionPath(resource) : `${cssType ? cssPath : jsPath}/${resource}`;

        return `${resourcePath}${this.atsd ? "" : `;jsessionid=${this.jsessionid}`}`;
    }

    /**
     * Updates the provider state
     * @param details new connection details
     */
    private updateSettings(details: IConnectionDetails): void {
        this.url = details.url;
        if (details.cookie) {
            this.jsessionid = details.cookie[0].split(";")[0]
                .split("=")[1];
        }
        this.atsd = details.atsd;
    }
}

/**
 * Replaces all comments with spaces
 * @param text the text to replace comments
 * @returns the modified text
 */
const deleteComments: (text: string) => string = (text: string): string => {
    let content: string = text;
    const multiLine: RegExp = /\/\*[\s\S]*?\*\//g;
    const oneLine: RegExp = /^[ \t]*#.*/mg;
    let match: RegExpExecArray | null = multiLine.exec(content);
    if (!match) {
        match = oneLine.exec(content);
    }

    while (match) {
        const newLines: number = match[0].split("\n").length - 1;
        const spaces: string = Array(match[0].length)
            .fill(" ")
            .concat(
                Array(newLines)
                    .fill("\n"),
            )
            .join("");
        content = `${content.substr(0, match.index)}${spaces}${content.substr(match.index + match[0].length)}`;
        match = multiLine.exec(content);
        if (!match) {
            match = oneLine.exec(content);
        }
    }

    return content;
};
