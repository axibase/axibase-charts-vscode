import {
    ClientRequest,
    IncomingMessage,
    OutgoingHttpHeaders,
    request as http,
} from "http";
import { request as https, RequestOptions } from "https";
import { URL } from "url";
import {
    window,
    workspace,
    WorkspaceConfiguration
} from "vscode";
import { IConnectionDetails } from "./panelContentProvider";
import { statusFamily, StatusFamily, userAgent } from "./util";
const configSection: string = "axibaseCharts";
export const languageId: string = "axibasecharts";
const errorMessage: string = "Configure connection properties in VSCode > Preferences > Settings. Open Settings," +
    " search settings for 'axibase', and enter the requested connection properties.";

/**
 * Constructs connection details based on the extension configuration and an input box:
 * tries to connect to server and get cookies, triggers window with error message
 * if any connection error has been occurred, otherwise triggers inform window.
 */
export async function constructConnection(): Promise<IConnectionDetails> {
    const config: WorkspaceConfiguration = workspace.getConfiguration(configSection);
    const protocol: string | undefined = config.get("protocol");
    if (!protocol) {
        throw new Error(errorMessage);
    }
    const address: string | undefined = config.get("hostname");
    if (!address) {
        throw new Error(errorMessage);
    }
    const port: number | undefined = config.get("port");
    if (!port) {
        throw new Error(errorMessage);
    }
    const url: string = `${protocol}://${address}:${port}`;
    let password: string | undefined;
    const username: string | undefined = config.get("username");
    if (username) {
        password = await window.showInputBox({
            ignoreFocusOut: true, password: true,
            prompt: `Enter the password for user ${username} to connect ` +
                `to ${address}:${port}. Exit VSCode to terminate the session.`,
        });
    }

    let cookie: string[] | undefined;
    let atsd: boolean | undefined;
    try {
        [cookie, atsd] = await performRequest(url, username, password);
    } catch (err) {
        window.showErrorMessage(err);
        throw err;
    }
    window.showInformationMessage(
        `Connected to ${address}:${port} ${username && password ? `as ${username}` : ""}`);
    atsd = atsd === undefined ? true : atsd;

    return { url, cookie, atsd };
}

/**
 * Gets the cookies for a user from the server and tests if it ATSD or not
 * @param address the target server's URL address
 * @param username the target user's username
 * @param password the target user's password
 */
function performRequest(address: string, username?: string, password?: string): Promise<[string[], boolean]> {
    const timeout: number = 3000; // milliseconds (3 s)
    const url: URL = new URL(address);
    const headers: OutgoingHttpHeaders = (username && password) ? {
        "Authorization": `Basic ${new Buffer(`${username}:${password}`).toString("base64")}`,
        "user-agent": userAgent,
    } : {
            "user-agent": userAgent,
        };

    const options: RequestOptions = {
        hostname: url.hostname,
        method: "GET",
        path: (username && password) ? "/api/v1/ping" : "",
        port: url.port,
        protocol: url.protocol,
        rejectUnauthorized: false, // allows self-signed certificates
        timeout,
    };
    options.headers = headers;
    const request: (options: RequestOptions | string | URL, callback?: (res: IncomingMessage) => void)
        => ClientRequest = (url.protocol === "https:") ? https : http;

    return new Promise<[string[], boolean]>(
        (resolve: (result: [string[], boolean]) => void, reject: (err: Error) => void): void => {
            const clientRequest: ClientRequest = request(options, (res: IncomingMessage) => {
                handleResponse(res, resolve, reject);
            });
            clientRequest.on("socket", () => {
                clientRequest.setTimeout(timeout);
            });
            clientRequest.on("timeout", () => {
                clientRequest.abort();
                reject(new Error("The request has exceeded the timeout"));
            });
            clientRequest.on("error", reject);
            clientRequest.end();
        },
    );
}

/**
 * Processes the incoming message
 * @param res the incoming message
 * @param resolve callback on success
 * @param reject callback on error
 */
function handleResponse(
    res: IncomingMessage,
    resolve: (result: [string[], boolean]) => void,
    reject: (err: Error) => void,
): void {
    res.on("error", reject);
    const family: StatusFamily = statusFamily(res.statusCode);
    if (family === StatusFamily.CLIENT_ERROR || family === StatusFamily.SERVER_ERROR) {
        if (res.statusCode === 401) {
            return reject(new Error(`Login failed with status code ${res.statusCode}`));
        } else {
            return reject(new Error(`Unexpected Response Code ${res.statusCode}`));
        }
    }
    const cookies: string[] | undefined = res.headers["set-cookie"];
    if (!cookies || cookies.length < 1) {
        return reject(new Error("Cookie is empty"));
    }
    const server: string | string[] | undefined = res.headers.server;
    let atsd: boolean;
    if (!server || Array.isArray(server)) {
        atsd = false;
    } else {
        const lowerCased: string = server.toLowerCase();
        atsd = lowerCased.includes("atsd");
    }
    resolve([cookies, atsd]);
}
