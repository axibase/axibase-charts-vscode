import { ResourcesProviderBase } from "./resourcesProviderBase";
import { Setting } from "./setting";

interface IDictionary { $schema: string; settings: Setting[]; }

export class ResourcesProviderWeb extends ResourcesProviderBase {

    constructor() {
        super();
    }
    /**
     * Reads dictionary from "dictionary.json" file
     * @returns array of settings from the file
     */
    protected readSettings(): Setting[] {
        const jsonContent: string = require("../dictionary.json");
        const dictionary: IDictionary = (jsonContent as any) as IDictionary;

        return dictionary.settings;
    }

    /**
     * Reads descriptions from "descriptions.md" file
     * @returns map of settings names and descriptions
     */
    protected readDescriptions(): Map<string, string> {
        const content = require("../descriptions.md").default;
        const map: Map<string, string> = new Map();
        // ## settingname\n\nsetting description[url](hello#html)\n
        const regExp: RegExp = /\#\# ([a-z]+?)  \n  \n([^\s#][\S\s]+?)  (?=\n  (?:\n(?=\#)|$))/g;
        let match: RegExpExecArray | null = regExp.exec(content);
        while (match !== null) {
            const [, name, description] = match;
            map.set(name, description);
            match = regExp.exec(content);
        }

        return map;
    }
}
