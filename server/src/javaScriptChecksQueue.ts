import { TextRange } from "./textRange";

export class JavaScriptChecksQueue {

    /**
     * for example, window.roundToTen = ...
     */
    private primarilySettings: TextRange[] = [];

    /**
     * for example, var v = ["abc"]
     */
    private simpleSettings: TextRange[] = [];

    public dequeue(): TextRange {
        if (this.hasElements()) {
            return this.primarilySettings.shift() || this.simpleSettings.shift();
        }
        throw new Error("PriorityQueue is empty.");
    }

    public hasElements(): boolean {
        return (this.primarilySettings.length !== 0) || (this.simpleSettings.length !== 0);
    }

    public queue(statement: TextRange) {
        if (statement.priority === PRIORITIES.HIGH) {
            this.primarilySettings.push(statement);
        } else {
            this.simpleSettings.push(statement);
        }

    }
}
