import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { createDiagnostic, deleteComments } from "./util";
import PriorityQueue from "ts-priority-queue";
//import * as $ from "jquery";
import { DOMWindow, JSDOM } from "jsdom";
import { TextRange } from "./textRange";

export class JsDomCaller {

    /**
     * Contains function/array and etc. names which allowed to be assigned to particular setting
     */
    private static readonly allowedSettingValuesMap: Map<string, string[]> = new Map([
        ["var", [
            "getTags", "getSeries", "getMetrics", "getEntities", "range"
        ]],

        ["value", ["metric", "entity", "tags", "value", "previous", "movavg",
            "detail", "forecast", "forecast_deviation", "lower_confidence", "upper_confidence",
            "percentile", "max", "min", "avg", "sum", "delta", "counter", "last", "first",
            "min_value_time", "max_value_time", "count", "threshold_count", "threshold_percent",
            "threshold_duration", "time", "bottom", "top", "meta", "entityTag", "metricTag", "median",
            "average", "minimum", "maximum", "series", "getValueWithOffset", "getValueForDate",
            "getMaximumValue"
        ]],

        ["script", ["widget", "config", "dialog"]],

        ["options", ["requestMetricsSeriesValues", "requestEntitiesMetricsValues",
            "requestPropertiesValues", "requestMetricsSeriesOptions", "requestEntitiesMetricsOptions",
            "requestPropertiesOptions"]],

        ["replaceValue", ["value", "time", "previousValue", "previousTime"]]
    ]);

    private static readonly CONTENT_POSITION: number = 2;

    /**
     * Used in PriorityQueue below to ensure that the udf is placed earlier than it's first call
     */
    private static readonly priorityMap: Map<string, number> = new Map([
        ["import", 3],
        ["script", 2],
        ["var", 1],
        ["value", 1],
        ["options", 1],
        ["replaceValue", 1]
    ]);

    /**
     * Generates a list of arguments with same name to use in a function call
     * @param amount number of arguments
     * @param name arguments name
     * @returns string containing array of `amount` `name`s
     */
    // private static generateCall(amount: number, name: string): string {
    //     const names: string = Array(amount)
    //         .fill(name)
    //         .join();

    //     return `, ${names}`;
    // }

    /**
     * Adds `return ` and `; ` to the statement and calls JSON.stringify()
     * @param content statement to be stringified
     * @returns stringified JavaScript statement
     */
    private static stringifyStatement(content: string): string {
        let statement: string = content.trim();
        if (!statement.startsWith("return")) {
            statement = `return ${content} `;
        }
        if (!content.endsWith(";")) {
            statement = `${statement}; `;
        }

        return JSON.stringify(statement);
    }

    private currentLineNumber: number = 0;
    //private importCounter: number = 0;
    // private readonly imports: string[] = [];
    private readonly lines: string[];
    private match: RegExpExecArray | null | undefined;
    private readonly statements: TextRange[] = [];
    private toEvaluate: string = this.getScopeRestrictionObjects();
    private readonly queue = new PriorityQueue({
        comparator: function (a: TextRange, b: TextRange) {
            return b.priority - a.priority;
        }
    });

    public constructor(text: string) {
        this.lines = deleteComments(text)
            .split("\n");
    }

    private getScopeRestrictionFunction(settingName: string, settingValue: string): string {
        return `(function(${JsDomCaller.allowedSettingValuesMap.get(settingName).join(",")}){return ${settingValue};
    })(...Object.values(${settingName}Object));`;
    }
    private getScopeRestrictionObjects(): string {
        let scopeRestrictionObjects: string = "";
        for (let s of ["var", "script", "replaceValue", "value", "options"])
            scopeRestrictionObjects = `${scopeRestrictionObjects}${s}Object={${this.getScopeRestrictionObjectFields(
                JsDomCaller.allowedSettingValuesMap.get(s))}};\n\n`;
        return scopeRestrictionObjects;
    }

    private getScopeRestrictionObjectFields(list: string[]): string {
        return list.map((f: any) => { return `${f}: function ${f}(){}` }).join(",\n");
    }

    /**
     * Evaluates all found JavaScript statements in this.document
     * @param validateAll if `false`, validates var only 
     * @returns diagnostic for each invalid statement
     */
    public validate(validateAll: boolean): Diagnostic[] {
        const result: Diagnostic[] = [];
        this.parseJsStatements(validateAll);
        const dom: JSDOM = new JSDOM("<html></html>", { resources: "usable", runScripts: "outside-only" });
        const window: DOMWindow = dom.window;
        //const jquery: JQuery<DOMWindow> = $(dom.window);
        //let range: Range = this.statements[0].range;
        //this.statements.forEach((statement: TextRange) => {
        let queueElement: TextRange;
        while (this.queue.length !== 0) {
            queueElement = this.queue.dequeue();
            this.toEvaluate = `${this.toEvaluate}${queueElement.text}`;
            try {
                window.eval(this.toEvaluate);
            } catch (err) {
                // let isImported: boolean = false;
                // for (const imported of this.imports) {
                //     if (new RegExp(imported, "i").test(err.message)) {
                //         isImported = true;
                //         break;
                //     }
                // }
                // if (!isImported) {
                    result.push(createDiagnostic(queueElement.range, err.message, DiagnosticSeverity.Warning));
                // }
                break;
            }
        }

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
                this.match = /^\s*script/.exec(line);
                if (this.match) {
                    this.processScript();
                    continue;
                }
                this.match = /^\s*import\s+(\S+)\s*=(.+)/.exec(line);
                if (this.match) {
                    this.processImport();
                    continue;
                }
                this.match = /^\s*replace-value\s*=/.exec(line);
                if (this.match) {
                    this.processReplaceValue();
                    continue;
                }
                this.match = /^\s*value\s*=/.exec(line);
                if (this.match) {
                    this.processValue();
                    continue;
                }
                this.match = /(^\s*options\s*=[ \t]*javascript:[ \t]*)(\S+[ \t\S]*)$/.exec(line);
                if (this.match) {
                    this.processOptions();
                    continue;
                }
            }
            this.match = /^\s*var\s*\w+\s*=/.exec(line);
            if (this.match) {
                this.processVar();
            }
        }
    }
    private processImport(): void {
        if (!this.match) {
            throw new Error("We're trying to process import, but this.match is not defined");
        }
        // const content: string = this.match[1];
        // const matchStart: number = this.match[1].length;
        // const statement: TextRange = new TextRange(`import * as ${content} from "${this.match[2]}";\n`,
        //     Range.create(
        //         this.currentLineNumber, matchStart,
        //         this.currentLineNumber, matchStart + this.match[JsDomCaller.CONTENT_POSITION].length,
        //     ), JsDomCaller.priorityMap.get("import")
        // );
        // this.queue.queue(statement);
        this.toEvaluate = `import * as ${this.match[1]} from "${this.match[2].trim()}";\n${this.toEvaluate}`;
    }

    private processOptions(): void {
        if (!this.match) {
            throw new Error("We're trying to process options, but this.match is not defined");
        }
        const content: string = JsDomCaller.stringifyStatement(this.match[JsDomCaller.CONTENT_POSITION]);
        const matchStart: number = this.match[1].length;
        const statement: TextRange = new TextRange(`;\n${content}`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + this.match[JsDomCaller.CONTENT_POSITION].length,
            ), JsDomCaller.priorityMap.get("options")
        );
        this.statements.push(statement);
        this.queue.queue(statement);
    }

    private processReplaceValue(): void {
        if (!this.match) {
            throw new Error("We're trying to process replaceValue, but this.match is not defined");
        }
        const content: string = this.getCurrentLine();
        const matchStart: number = this.match.index + this.match[0].length;
        const statement: TextRange = new TextRange(`replaceValue=${this.getScopeRestrictionFunction("replaceValue",
            content.substring(this.match[0].length))}\n`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + content.length,
            ), JsDomCaller.priorityMap.get("replaceValue")
        );
        this.statements.push(statement);
        this.queue.queue(statement);
    }

    private processScript(): void {
        let line: string | undefined = this.getCurrentLine();
        let content: string;
        let range: Range;
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
        let jsInOrbTags: RegExpMatchArray | null = content.match(/(\@\{)(.*)(?=\})/)
        if (jsInOrbTags) {
            content = content.replace(/\@\{.+\}/, jsInOrbTags[2])
        }
        let userDefinedFunction: RegExpMatchArray | null = content.match(/window\.(\w+)\s*=\s*function/);
        let priority: number = 0;
        if (userDefinedFunction) {
            //content = content.replace(userDefinedFunction[0], "function " + userDefinedFunction[1]);
            priority = JsDomCaller.priorityMap.get("script");
        }
        const statement: TextRange = new TextRange(`${content};\n`,
            range, priority
        );
        this.statements.push(statement);
        this.queue.queue(statement);
    }

    private processValue(): void {
        if (!this.match) {
            throw new Error("We're trying to process value, but this.match is not defined");
        }
        const content: string = JsDomCaller.stringifyStatement(this.match[JsDomCaller.CONTENT_POSITION]);
        const matchStart: number = this.match.index + this.match[1].length;
        const statement: TextRange = new TextRange(`${this.getScopeRestrictionFunction("value",
            content.substring(content.indexOf(this.match[0])))};\n`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + this.match[JsDomCaller.CONTENT_POSITION].length,
            ), JsDomCaller.priorityMap.get("value")
        );
        this.statements.push(statement);
        this.queue.queue(statement);
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
        let openBrackets: RegExpMatchArray | null = line.match(/((\s*[\[\{\(]\s*)+)/g);
        let closeBrackets: RegExpMatchArray | null = line.match(/((\s*[\]\}\)]\s*)+)/g);
        if (openBrackets) {
            if (closeBrackets && openBrackets.map(s => s.trim()).join("").length !==
                closeBrackets.map(s => s.trim()).join("").length
                || closeBrackets === null) {
                // multiline var
                while ((line = this.getLine(++this.currentLineNumber)) && !/\bendvar\b/.test(line)) {
                    content += `${line} \n`;
                }
                range.end.line = this.currentLineNumber - 1;
            }
        }
        //content = JSON.stringify(content);
        const statement: TextRange = new TextRange(`${this.match[0]}${this.getScopeRestrictionFunction("var",
            content.substring(this.match[0].length))}\n`,
            range, JsDomCaller.priorityMap.get("var")
        );
        this.statements.push(statement);
        this.queue.queue(statement);
    }

}
