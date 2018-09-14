import { version as vscodeVersion } from "vscode";
// @ts-ignore
import { name, version } from "../../package.json";

export const userAgent: string = `${name}/${version} vscode/${vscodeVersion}`;
