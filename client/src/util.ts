import { version as vscodeVersion } from "vscode";
// @ts-ignore
import { name, publisher, version } from "../../package.json";

export const userAgent: string = `${name}/${version} vscode/${vscodeVersion}`;

export enum StatusFamily {
    SERVER_ERROR = 5,
    CLIENT_ERROR = 4,
    SUCCESSFUL = 2,
    REDIRECT = 3,
    INFO = 1,
}

export const statusFamily: (statusCode: number | undefined) => StatusFamily =
    (statusCode: number | undefined): StatusFamily => {
        const firstNumber: number = statusCode ? Math.floor(statusCode / 100) : 0;
        switch (firstNumber) {
            case 1:
                return StatusFamily.INFO;
            case 2:
                return StatusFamily.SUCCESSFUL;
            case 3:
                return StatusFamily.REDIRECT;
            case 4:
                return StatusFamily.CLIENT_ERROR;
            case 5:
                return StatusFamily.SERVER_ERROR;
            default:
                throw new Error(`Incorrect status code ${statusCode}`);
        }
    };

export const appId: string = `${publisher}.${name}`;
