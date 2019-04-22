import { join } from "path";
import {
    ExtensionContext, TextDocument, Uri, ViewColumn, WebviewPanel, window, workspace
} from "vscode";
import { languageId } from "./extension";

export interface IConnectionDetails {
    atsd: boolean;
    cookie?: string[];
    url: string;
}

/**
 * Stores connection details and extension context, creates WebviewPanel and sets it's content.
 */
export class AxibaseChartsProvider {
    public panelDisposed: boolean = false;

    private readonly absolutePath: (path: string) => string;
    private atsd!: boolean;
    private jsessionid: string | undefined;
    private text: string | undefined;
    private url!: string;
    private panel: WebviewPanel;
    private context: ExtensionContext;

    public constructor(details: IConnectionDetails, context: ExtensionContext) {
        this.updateSettings(details);
        this.absolutePath = context.asAbsolutePath;
        this.context = context;
        this.createPanel();
    }

    /**
     * Applies new connection settings to the provider.
     * Triggers html content update.
     * @param details New connection settings.
     */
    public changeSettings(details: IConnectionDetails): void {
        this.updateSettings(details);
        this.updateWebviewContent();
    }

    public createPanel() {
        this.panel = window.createWebviewPanel(
            languageId,
            `Preview Portal`,
            ViewColumn.Two,
            {
                // Allow <script>s in the webview content.
                enableScripts: true,
                // Allow the access to resources only in extension's resources directory.
                localResourceRoots: [Uri.file(this.absolutePath(join("client/resources")))]
            }
        );

        // The panel was closed.
        this.panel.onDidDispose(
            () => {
                this.panelDisposed = true;
            },
            null,
            this.context.subscriptions
        );
        this.panelDisposed = false;
    }

    /**
     * Sets html for WebviewPanel.
     * @param document Document, which content must be used as config for portal.
     */
    public updateWebviewContent(document?: TextDocument): void {
        if (document) {
            this.text = deleteComments(document.getText());
            this.clearUrl();
            this.replaceImports();
            this.addUrl();
        }
        if (this.panelDisposed) {
            this.createPanel();
        }
        this.panel.webview.html = this.getHtml();
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
        return Uri.file(
            this.absolutePath(join("client", resource))
        ).with({ scheme: "vscode-resource" }).toString();
    }

    /**
     * Creates the html from a configuration of a portal
     */
    private getHtml(): string {
        const theme: string | undefined = workspace.getConfiguration("workbench")
            .get("colorTheme");
        let darkTheme: string = "";
        let textColor = "black";
        if (theme && /[Bb]lack|[Dd]ark|[Nn]ight/.test(theme)) {
            textColor = "white";
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
            textColor,
            url: this.url
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
     * `import fred = https://axibase.com/portal/resource/scripts/fred.js`
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
     * Generates the path to a resource at serever.
     * @param resource name of a static resource
     */
    private resource(resource: string): string {
        const jsPath: string = `${this.url}/${this.atsd ? "web/js/portal" : "JavaScript/portal/JavaScript"}`;
        const cssPath: string = `${this.url}/${this.atsd ? "web/css/portal" : "JavaScript/portal/CSS"}`;
        const cssType: boolean = /.*\.css$/.test(resource);
        const resourcePath: string = `${cssType ? cssPath : jsPath}/${resource}`;

        return `${resourcePath}${this.jsessionid ? `;jsessionid=${this.jsessionid}` : ""}`;
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
        } else {
            this.jsessionid = undefined;
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
