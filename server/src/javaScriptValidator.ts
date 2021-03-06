import { DOMWindow, JSDOM } from "jsdom";
import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver";
import { CheckPriority } from "./checkPriority";
import { JavaScriptChecksQueue } from "./javaScriptChecksQueue";
import { TextRange } from "./textRange";
import { createDiagnostic, deleteComments } from "./util";

export class JavaScriptValidator {

    private currentLineNumber: number = 0;
    private importCounter: number = 0;
    private readonly imports: string[] = [];
    private readonly lines: string[];
    private match: RegExpExecArray | null | undefined;
    private toEvaluate: string = "";
    private readonly queue: JavaScriptChecksQueue = new JavaScriptChecksQueue();

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
        let queueElement: TextRange;
        while (this.queue.hasElements()) {
            queueElement = this.queue.dequeue();
            this.toEvaluate = queueElement.text;
            try {
                window.eval(this.toEvaluate);
            } catch (err) {
                let isImported: boolean = false;
                for (const imported of this.imports) {
                    if (new RegExp(imported, "i").test(err.message)) {
                        isImported = true;
                        this.toEvaluate = this.toEvaluate.replace(queueElement.text, "");
                        break;
                    }
                }
                if (!isImported) {
                    result.push(createDiagnostic(queueElement.range, err.message, DiagnosticSeverity.Warning));
                }
            }
        }

        return result;
    }

    /**
     * Generates a list of arguments with same name to use in a function call
     * @param amount number of arguments
     * @param name arguments name
     * @returns string containing array of `amount` `name`s
     */
    private generateCall(amount: number, name: string): string {
        const names: string = Array(amount)
            .fill(name)
            .join();

        return `${names}`;
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
     * @param validateAll if `false`, validates "var" only
     */
    private parseJsStatements(validateAll: boolean): void {
        for (; this.currentLineNumber < this.lines.length; this.currentLineNumber++) {
            const line: string = this.getCurrentLine();
            if (validateAll) {
                this.match = /^\s*import\s+(\S+)\s*=.+/.exec(line);
                if (this.match) {
                    this.imports.push(this.match[1]);
                    this.importCounter++;
                    continue;
                }
                this.match = /^\s*replace-value\s*=\s*/.exec(line);
                if (this.match) {
                    this.processReplaceValue();
                    continue;
                }
                this.match = /^\s*value\s*=\s*/.exec(line);
                if (this.match) {
                    this.processValue();
                    continue;
                }
                this.match = /(^\s*options\s*=\s*javascript:\s*)(\S+[\s\S]*)$/.exec(line);
                if (this.match) {
                    this.processOptions();
                    continue;
                }
                this.match = /^\s*csv\s*(\w*)\s*/.exec(line);
                if (this.match) {
                    const statement: TextRange = new TextRange(`var ${this.match[1]}=[];`,
                        Range.create(
                            this.currentLineNumber, this.match.index,
                            this.currentLineNumber, this.match.index + this.match.length,
                        )
                    );
                    statement.textPriority = CheckPriority.High;
                    this.queue.queue(statement);
                    continue;
                }
            }
            this.match = /^\s*script/.exec(line);
            if (this.match) {
                /**
                 * passes through script lines neither validateAll is true or false
                 * to prevent var checks inside the script setting
                 */
                this.processScript(validateAll);
                continue;
            }
            this.match = /^\s*var\s*\w+\s*=/.exec(line);
            if (this.match) {
                this.processVar();
            }
        }
    }

    private processOptions(): void {
        if (!this.match) {
            throw new Error("We're trying to process options, but this.match is not defined");
        }
        const matchStart: number = this.match[1].length;
        const value: string = this.match[2];
        const statement: TextRange = new TextRange(`replaceValue=(function(requestMetricsSeriesValues,` +
            `requestEntitiesMetricsValues,requestPropertiesValues,requestMetricsSeriesOptions,` +
            `requestEntitiesMetricsOptions,requestPropertiesOptions)` +
            `{ return ${value}; })(${this.generateCall(6, "new Function()")});\n`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + value.length,
            )
        );
        this.queue.queue(statement);
    }

    private processReplaceValue(): void {
        if (!this.match) {
            throw new Error("We're trying to process replaceValue, but this.match is not defined");
        }
        const content: string = this.getCurrentLine();
        const matchStart: number = this.match[0].length;
        const value: string = content.substring(matchStart);
        const statement: TextRange = new TextRange(`replaceValue=(function(value,time,previousValue,previousTime)` +
            `{ return ${value}; })(${this.generateCall(4, "5")});\n`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + value.length,
            )
        );
        this.queue.queue(statement);
    }

    /**
     * @param validateScript if `false`, just skip script lines to ingnore "var" inside
     */
    private processScript(validateScript: boolean): void {
        let line: string | undefined = this.getCurrentLine();
        let content: string = "";
        let range: Range;
        range = {
            end: { character: line.length, line: this.currentLineNumber },
            start: { character: 0, line: this.currentLineNumber + 1 },
        };
        this.match = /script\s*=\s*(\S+[\s\S]*)$/.exec(line);
        if (this.match) {
            // one-line script
            content = this.match[1];
            range.start = { character: line.indexOf(content), line: this.currentLineNumber };
        } else {
            // multi-line script
            line = this.getLine(++this.currentLineNumber);
            while (line && !/\bendscript\b/.test(line)) {
                content += `${line}\n`;
                line = this.getLine(++this.currentLineNumber);
            }
            line = this.getLine(this.currentLineNumber - 1);
            range.end = {
                character: line.length, line: this.currentLineNumber - 1,
            };
        }
        if (validateScript) {
            let jsInOrbTags: RegExpMatchArray | null = content.match(/(\@\{)(.*)(?=\})/);
            if (jsInOrbTags) {
                content = content.replace(/\@\{.+\}/, jsInOrbTags[2]);
            }
            let userDefinedFunction: RegExpMatchArray | null = content.match(/window\.(\w+)\s*=\s*function/);
            let priority: number = CheckPriority.Low;
            if (userDefinedFunction) {
                priority = CheckPriority.High;
            }
            const statement: TextRange = new TextRange(`${content};\n`,
                range
            );
            statement.textPriority = priority;
            this.queue.queue(statement);
        }
    }

    private processValue(): void {
        if (!this.match) {
            throw new Error("We're trying to process value, but this.match is not defined");
        }
        const content: string = this.getCurrentLine();
        const matchStart: number = this.match[0].length;
        const value: string = content.substring(matchStart);
        const statement: TextRange = new TextRange(`(function(value,previous,movavg,
        detail,forecast,forecast_deviation,lower_confidence,upper_confidence,
        percentile,max,min,avg,sum,delta,counter,last,first,
        min_value_time,max_value_time,count,threshold_count,threshold_percent,
        threshold_duration,time,bottom,top,meta,entityTag,metricTag,median,
        average,minimum,maximum,getValueWithOffset,getValueForDate,getMaximumValue,data,config,series,metric,entity,tags
        ${this.imports.length > 0 ? "," + this.imports : ""}){ return ${value}; })` +
            `(${this.generateCall(38, "new Function()")},` +
            `${this.generateCall(1, "[]")},` +
            `${this.generateCall(this.importCounter + 3, "{}")});\n`,
            Range.create(
                this.currentLineNumber, matchStart,
                this.currentLineNumber, matchStart + value.length,
            )
        );
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
                line = this.getLine(++this.currentLineNumber);
                while (line && !/\bendvar\b/.test(line)) {
                    content += `${line} \n`;
                    line = this.getLine(++this.currentLineNumber);
                }
                range.end.line = this.currentLineNumber - 1;
            }
        }
        const statement: TextRange = new TextRange(`${this.match[0]}(function(getTags, getSeries,` +
            `getMetrics, getEntities, range)` +
            `{ return ${content.substring(this.match[0].length)}; })
            (${this.generateCall(5, "new Function()")});\n`, range
        );
        this.queue.queue(statement);
    }

}
