import { join } from "path";
import {
    TextDocument, Uri, workspace
} from "vscode";
import { constructConnection, IConnectionDetails } from "./connectionUtils";

/**
 * Stores connection details, preprocesses config:
 *  1) clearUrl()
 *  2) replaceImports()
 *  3) addUrl()
 * Generates HTML for WebviewPanel using preprocessed config.
 */
export class PanelContentProvider {
    private readonly absolutePath: (path: string) => string;
    private atsd!: boolean;
    private jsessionid: string | undefined;
    private text: string | undefined;
    private url!: string;

    public constructor(absolutePath: (path: string) => string) {
        this.absolutePath = absolutePath;
    }

    /**
     * Prepares html for WebviewPanel.
     * @param document Document, which content must be used as config for portal.
     */
    public getWebviewContent(document?: TextDocument): string {
        if (this.url == null) {
            /**
             * Unable to connect to ATSD after changes in settings.
             */
            return `<h3>Unable to connect to ATSD</h3>
<p>Check connection <a href="https://github.com/axibase/axibase-charts-vscode#live-preview"> settings</a>.</p>`;
        }
        if (document) {
            this.text = document.getText();
            this.clearUrl();
            this.replaceImports();
            this.addUrl();
        }
        return this.getHtml();
    }

    /**
     * Tries to connect to ATSD; if no errors occured, sets connection fields:
     * url, jsessionid and atsd.
     */
    public async setConnectionSettings() {
        let details: IConnectionDetails;
        try {
            details = await constructConnection();
        } catch (err) {
            /**
             * Unable to connect to ATSD after changes in settings.
             */
            this.url = this.jsessionid = this.atsd = null;
            return;
        }
        this.url = details.url;
        this.jsessionid = details.jsessionid;
        this.atsd = details.atsd;
    }

    /**
     * Returns path to local resource as Uri.
     * @param resource
     */
    public getUri(resource: string): Uri {
        return Uri.file(
            this.absolutePath(join("client", resource))
        );
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
        return this.getUri(resource).with({ scheme: "vscode-resource" }).toString();
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
        color:  var(--vscode-editor-foreground);
      }
	</style>
	<script>
	    window.previewOptions = ${JSON.stringify({
            jsessionid: this.jsessionid,
            text: this.text,
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
     * Generates the path to a resource at server.
     * @param resource name of a static resource
     */
    private resource(resource: string): string {
        const jsPath: string = `${this.url}/${this.atsd ? "web/js/portal" : "JavaScript/portal/JavaScript"}`;
        const cssPath: string = `${this.url}/${this.atsd ? "web/css/portal" : "JavaScript/portal/CSS"}`;
        const cssType: boolean = /.*\.css$/.test(resource);
        const resourcePath: string = `${cssType ? cssPath : jsPath}/${resource}`;

        return `${resourcePath}${this.jsessionid ? `;jsessionid=${this.jsessionid}` : ""}`;
    }
}
