import { join } from "path";
import {
    Event, EventEmitter, TextDocument, TextDocumentContentProvider, Uri, workspace,
} from "vscode";
import { languageId } from "./extension";

const SCRIPTS_PATH: string = join(__dirname, "../../scripts/");

export interface IConnectionDetails {
    cookie?: string;
    url: string;
}

export class AxibaseChartsProvider implements TextDocumentContentProvider {
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
    private cookie: string | undefined;
    private innerDocument: TextDocument;
    private readonly onDidChangeEmitter: EventEmitter<Uri>;
    private text: string | undefined;
    private url: string;

    public constructor(details: IConnectionDetails, document: TextDocument) {
        this.onDidChangeEmitter = new EventEmitter<Uri>();
        this.innerDocument = document;
        this.url = details.url;
        this.cookie = details.cookie;
    }

    public changeSettings(details: IConnectionDetails): void {
        this.url = details.url;
        this.cookie = details.cookie;
        this.update();
    }

    public async provideTextDocumentContent(): Promise<string> {
        if (this.innerDocument.languageId !== languageId) {
            return Promise.reject();
        }
        this.text = deleteComments(this.innerDocument.getText());
        this.clearUrl();
        this.replaceImports();

        this.addUrl();
        const html: string = this.getHtml();

        return html;
    }

    public update(): void {
        this.onDidChangeEmitter.fire(AxibaseChartsProvider.previewUri);
    }

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
            this.text =
                `${this.text.substr(0, match.index - 1)}[configuration]\n  ${this.text.substr(match.index)}`;
            match = /^[ \t]*\[configuration\]/i.exec(this.text);
        }
        if (match) {
            this.text = `${this.text.substr(0, match.index + match[0].length + 1)}  url = ${this.url}
${this.text.substr(match.index + match[0].length + 1)}`;
        }
    }

    private clearUrl(): void {
        this.url = this.url.trim()
            .toLowerCase();
        const match: RegExpExecArray | null = /\/+$/.exec(this.url);
        if (match) {
            this.url = this.url.substr(0, match.index);
        }
    }

    private getHtml(): string {
        const theme: string | undefined = workspace.getConfiguration("workbench")
            .get("colorTheme");
        const applyDark: boolean = theme !== undefined && /[Bb]lack|[Dd]ark|[Nn]ight/.test(theme);

        return `<!DOCTYPE html>
<html>

<head>
	<link rel="stylesheet" type="text/css" href="${join(SCRIPTS_PATH, "jquery-ui-1.9.1.custom.min.css")}">
    <link rel="stylesheet" type="text/css" href="${join(SCRIPTS_PATH, "charts.min.css")}">
    ${applyDark ? `<link rel="stylesheet" type="text/css" href="${join(SCRIPTS_PATH, "black.css")}">` : ""}
	<style>
	  .portalPage body {
		padding: 0;
		background: var(--vscode-editor-background);
	  }
	</style>
	<script type="text/javascript" src="${join(SCRIPTS_PATH, "portal_init.js")}"></script>
	<script>
		if (typeof initializePortal === "function") {
			initializePortal(function (callback) {
				var configText = ${JSON.stringify(this.text)};
				if (typeof callback === "function") {
					callback([configText, portalPlaceholders = getPortalPlaceholders()]) ;
				}
			});
		}
	</script>
	<script type="text/javascript" src="${join(SCRIPTS_PATH, "jquery-1.8.2.min.js")}"></script>
	<script type="text/javascript" src="${join(SCRIPTS_PATH, "jquery-ui-1.9.0.custom.min.js")}"></script>
	<script type="text/javascript" src="${join(SCRIPTS_PATH, "d3.min.js")}"></script>
	<script type="text/javascript" src="${join(SCRIPTS_PATH, "highlight.pack.js")}"></script>
	<script type="text/javascript" src="${join(SCRIPTS_PATH, "charts.min.js")}"></script>
</head>

<body onload="onBodyLoad()">
    <script>
    ${this.cookie}</script>
	<div class="portalView"></div>
	<div id="dialog"></div>
</body>

</html>`;
    }

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

}

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
