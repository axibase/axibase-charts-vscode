import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic, deleteComments } from "./util";

import * as $ from "jquery";
import { DOMWindow, JSDOM } from "jsdom";
import { TextRange } from "./textRange";

export class JsDomCaller {
    private static readonly CONTENT_POSITION: number = 2;
    /**
     * Generates a list of arguments with same name to use in a function call
     * @param amount number of arguments
     * @param name arguments name
     * @returns string containing array of `amount` `name`s
     */
    private static generateCall(amount: number, name: string): string {
        const names: string = Array(amount)
            .fill(name)
            .join();

        return `, ${names}`;
    }

    /**
     * Adds `return` and `;` to the statement and calls JSON.stringify()
     * @param content statement to be stringified
     * @returns stringified JavaScript statement
     */
    private static stringifyStatement(content: string): string {
        let statement: string = content.trim();
        if (!statement.startsWith("return")) {
            statement = `return ${content}`;
        }
        if (!content.endsWith(";")) {
            statement = `${statement};`;
        }

        return JSON.stringify(statement);
    }

    private currentLineNumber: number = 0;
    private importCounter: number = 0;
    private readonly imports: string[] = [];
    private readonly lines: string[];
    private match: RegExpExecArray | null | undefined;
    private readonly statements: TextRange[] = [];

    public constructor(text: string) {
        this.lines = deleteComments(text)
            .split("\n");
    }

    /**
     * Evaluates all found JavaScript statements in this.document
     * @param validateAll if `false`, validates var only 
     * @returns diagnostic for each invalid statement
     */
    public validate(validateAll: boolean): Diagnostic[] {
        const result: Diagnostic[] = [];
        this.parseJsStatements(validateAll);

        const dom: JSDOM = new JSDOM("<html></html>", { runScripts: "outside-only" });
        const window: DOMWindow = dom.window;
        const jquery: JQuery<DOMWindow> = $(dom.window);
        this.statements.forEach((statement: TextRange) => {
            const toEvaluate: string =
                `(new Function("$", ${JSON.stringify(statement.text)})).call(window, ${jquery})`;
            try {
                window.eval(toEvaluate);
            } catch (err) {
                let isImported: boolean = false;
                for (const imported of this.imports) {
                    if (new RegExp(imported, "i").test(err.message)) {
                        isImported = true;
                        break;
                    }
                }
                if (!isImported) {
                    result.push(createDiagnostic(
                        statement.range,
                        DiagnosticSeverity.Warning, err.message,
                    ));
                }
            }
        });

        return result;
    }

    private getCurrentLine(): string {
        const line: string | undefined = this.getLine(this.currentLineNumber);
        if (line === undefined) {
            throw new Error("this.currentLineNumber points to nowhere");
        }

        return line;
    }

    private getLine(i: number): string | undefined {
        return (i < this.lines.length) ? this.lines[i] : undefined;
    }

    /**
     * Calls corresponding processor for all found JavaScript statements 
     * in this.document to prepare diagnostic if required
     * @param validateAll if `false`, validates var only
     */
    private parseJsStatements(validateAll: boolean): void {
        for (; this.currentLineNumber < this.lines.length; this.currentLineNumber++) {
            const line: string = this.getCurrentLine();
            if (validateAll || true) {
                this.match = /^[ \t]*script/.exec(line);
                if (this.match) {
                    this.processScript();
                    continue;
                }
                this.match = /^[ \t]*import[ \t]+(\S+)[ \t]*=.+/.exec(line);
                if (this.match) {
                    this.imports.push(this.match[1]);
                    this.importCounter++;
                    continue;
                }
                this.match = /(^[ \t]*replace-value[ \t]*=[ \t]*)(\S+[ \t\S]*)$/.exec(line);
                if (this.match) {
                    this.processReplaceValue();
                    continue;
                }
                this.match = /(^[ \t]*value[ \t]*=[ \t]*)(\S+[ \t\S]*)$/.exec(line);
                if (this.match) {
                    this.processValue();
                    continue;
                }
                this.match = /(^[ \t]*options[ \t]*=[ \t]*javascript:[ \t]*)(\S+[ \t\S]*)$/.exec(line);
                if (this.match) {
                    this.processOptions();
                    continue;
                }
            }
            this.match = /^\s*var\s*\w+\s+=\s+[\[|\{|\(]*/m.exec(line);
            if (this.match) {
                this.processVar();
            }
        }
    }

    private processOptions(): void {
        if (!this.match) {
            throw new Error("We're trying to process options, but this.match is not defined");
        }
        const content: string = JsDomCaller.stringifyStatement(this.match[JsDomCaller.CONTENT_POSITION]);
        const matchStart: number = this.match[1].length;
        const proxyFunctionCount: number = 6;
        const statement: TextRange = new TextRange(
            "const proxyFunction = new Proxy(new Function(), {});" +
            '(new Function("requestMetricsSeriesValues","requestEntitiesMetricsValues",' +
            '"requestPropertiesValues","requestMetricsSeriesOptions","requestEntitiesMetricsOptions",' +
            `"requestPropertiesOptions", ${content}` +
            `)).call(window${JsDomCaller.generateCall(proxyFunctionCount, "proxyFunction")})`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + this.match[JsDomCaller.CONTENT_POSITION].length,
            ),
        );
        this.statements.push(statement);
    }

    private processReplaceValue(): void {
        if (!this.match) {
            throw new Error("We're trying to process replaceValue, but this.match is not defined");
        }
        const content: string = JsDomCaller.stringifyStatement(this.match[JsDomCaller.CONTENT_POSITION]);
        const matchStart: number = this.match.index + this.match[1].length;
        const numbersCount: number = 4;
        const statement: TextRange = new TextRange(
            `(new Function("value","time","previousValue","previousTime", ${content}))
                .call(window${JsDomCaller.generateCall(numbersCount, "5")})`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + this.match[JsDomCaller.CONTENT_POSITION].length,
            ),
        );
        this.statements.push(statement);
    }

    private processScript(): void {
        let line: string | undefined = this.getCurrentLine();
        let content: string;
        let range: Range;
        this.match = /(^[ \t]*script[ \t]*=[\s]*)(\S+[\s\S]*)$/m.exec(line);
        if (this.match) {
            content = this.match[JsDomCaller.CONTENT_POSITION];
            const matchStart: number = this.match[1].length;
            range = {
                end: {
                    character: matchStart + this.match[JsDomCaller.CONTENT_POSITION].length,
                    line: this.currentLineNumber,
                },
                start: { character: this.match[1].length, line: this.currentLineNumber },
            };
            let j: number = this.currentLineNumber + 1;
            let nextLine: string | undefined = this.getLine(j);
            while (nextLine && !(/\bscript\b/.test(nextLine) || /\bendscript\b/.test(nextLine))) {
                nextLine = this.getLine(++j);
            }
            if (!(j === this.lines.length || !nextLine || /\bscript\b/.test(nextLine))) {
                line = this.getLine(++this.currentLineNumber);
                while (line !== undefined && !/\bendscript\b/.test(line)) {
                    content += `${line}\n`;
                    line = this.getLine(++this.currentLineNumber);
                }
                line = this.getLine(this.currentLineNumber - 1);
                if (!line) {
                    throw new Error("this.currentLineNumber - 1 points to nowhere");
                }
                range.end = {
                    character: line.length, line: this.currentLineNumber - 1,
                };
            }
        } else {
            line = this.getLine(this.currentLineNumber + 1);
            if (!line) {
                throw new Error("this.currentLineNumber + 1 points to nowhere");
            }
            range = {
                end: { character: line.length, line: this.currentLineNumber + 1 },
                start: { character: 0, line: this.currentLineNumber + 1 },
            };
            content = "";
            line = this.getLine(++this.currentLineNumber);
            while (line !== undefined && !/\bendscript\b/.test(line)) {
                content += `${line}\n`;
                line = this.getLine(++this.currentLineNumber);
            }
            line = this.getLine(this.currentLineNumber - 1);
            if (!line) {
                throw new Error("this.currentLineNumber - 1 points to nowhere");
            }
            range.end = {
                character: line.length, line: this.currentLineNumber - 1,
            };
        }
        content = JSON.stringify(content);
        const proxyCount: number = 2;
        const statement: TextRange = new TextRange(
            "const proxy = new Proxy({}, {});" +
            "const proxyFunction = new Proxy(new Function(), {});" +
            `(new Function("widget","config","dialog", ${content}))` +
            `.call(window${JsDomCaller.generateCall(1, "proxyFunction")}` +
            `${JsDomCaller.generateCall(proxyCount, "proxy")})`,
            range,
        );
        this.statements.push(statement);
    }

    private processValue(): void {
        if (!this.match) {
            throw new Error("We're trying to process value, but this.match is not defined");
        }
        const content: string = JsDomCaller.stringifyStatement(this.match[JsDomCaller.CONTENT_POSITION]);
        const matchStart: number = this.match.index + this.match[1].length;
        const importList: string = `"${this.imports.join('","')}"`;
        const proxyCount: number = 3;
        const proxyFunctionCountFirst: number = 33;
        const proxyArrayCount: number = 1;
        const proxyFunctionCountSecond: number = 3;
        const statement: TextRange = new TextRange(
            "const proxy = new Proxy({}, {});" +
            "const proxyFunction = new Proxy(new Function(), {});" +
            "const proxyArray = new Proxy([], {});" +
            '(new Function("metric","entity","tags","value","previous","movavg",' +
            '"detail","forecast","forecast_deviation","lower_confidence","upper_confidence",' +
            '"percentile","max","min","avg","sum","delta","counter","last","first",' +
            '"min_value_time","max_value_time","count","threshold_count","threshold_percent",' +
            '"threshold_duration","time","bottom","top","meta","entityTag","metricTag","median",' +
            '"average","minimum","maximum","series","getValueWithOffset","getValueForDate",' +
            `"getMaximumValue", ${importList}, ${content}` +
            `)).call(window${JsDomCaller.generateCall(proxyCount, "proxy")}` +
            `${JsDomCaller.generateCall(proxyFunctionCountFirst, "proxyFunction")}` +
            `${JsDomCaller.generateCall(proxyArrayCount, "proxyArray")}` +
            `${JsDomCaller.generateCall(proxyFunctionCountSecond, "proxyFunction")}` +
            `${JsDomCaller.generateCall(this.importCounter, "proxy")})`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + this.match[JsDomCaller.CONTENT_POSITION].length,
            ),
        );
        this.statements.push(statement);
    }

    private processVar(): void {
        if (!this.match) {
            throw new Error("We're trying to process var, but this.match is not defined");
        }
        let line: string | undefined = this.getCurrentLine();
        let content: string;
        let range: Range;
        content = line;
        range = {
            end: { character: line.length, line: this.currentLineNumber },
            start: { character: 0, line: this.currentLineNumber },
        };
        if (this.getLine(this.currentLineNumber + 1)) {
            // It's multiline var
            while ((line = this.getLine(++this.currentLineNumber)) && !/\bendvar\b/.test(line)) {
                content += `${line}\n`;
            }
            range.end.line = this.currentLineNumber - 1;
        }
        content = JSON.stringify(content);
        const statement: TextRange = new TextRange(
            "const varProxyFunction = new Proxy(new Function(), {});" +
            `(new Function(${content}))` +
            `.call(window${JsDomCaller.generateCall(1, "varProxyFunction")})`,
            range,
        );
        this.statements.push(statement);
    }

}
