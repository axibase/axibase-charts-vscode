import { TextRange } from "./textRange";

export class PriorityQueue {

    private currentIndex: number = 0;
    /**
     * for example, window.roundToTen = ...
     */
    private primarilySettings: TextRange[] = [];

    /**
     * for example, var v = ["abc"]
     */
    private simpleSettings: TextRange[] = [];

    public dequeue(): TextRange {
        let target: TextRange;
        if (this.hasElements()) {
            if (this.primarilySettings.length !== 0 && (this.currentIndex < this.primarilySettings.length)) {
                target = this.primarilySettings[this.currentIndex];
            } else {
                target = this.simpleSettings[this.currentIndex - this.primarilySettings.length];
            }
            this.currentIndex++;
            return target;
        }
        throw new Error("PriorityQueue is empty.");
    }

    public hasElements(): boolean {
        return this.currentIndex !== (this.primarilySettings.length + this.simpleSettings.length);
    }

    public queue(statement: TextRange) {
        if (statement.priority === 2) {
            this.primarilySettings.push(statement);
        } else {
            this.simpleSettings.push(statement);
        }

    }
}
