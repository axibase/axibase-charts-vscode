export class PossibleValue {

    public readonly value: string;
    /**
     * Description of value
     */
    public readonly detail: string = "";

    public constructor(value: string, detail?: string) {
        this.value = value;
        this.detail = detail;
    }
}
