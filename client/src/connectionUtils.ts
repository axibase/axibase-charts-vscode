import {
    window,
    workspace,
    WorkspaceConfiguration
} from "vscode";
import { statusFamily, StatusFamily, userAgent } from "./util";
const configSection: string = "axibaseCharts";
export const languageId: string = "axibasecharts";
const errorMessage: string = "Configure connection properties in VSCode > Preferences > Settings. Open Settings," +
    " search settings for 'axibase', and enter the requested connection properties.";
import { IncomingMessage } from "http";
import { Headers, UriOptions } from "request";
import request = require("request-promise-native");

export interface IConnectionDetails {
    atsd: boolean;
    jsessionid?: string;
    url: string;
}

let jsessionid: string | undefined;
let atsd: boolean | undefined;
/**
 * Constructs connection details based on the extension configuration and an input box:
 * tries to connect to server and get "Server" and "Set-Cookie" headers, triggers window with error message
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
    try {
        // Set atsd and jsessionid.
        await performRequest(url, username, password);
    } catch (err) {
        window.showErrorMessage(err.message);
        throw err;
    }
    window.showInformationMessage(
        `Connected to ${address}:${port} ${username && password ? `as ${username}` : ""}`);

    return { url, jsessionid, atsd };
}

/**
 * Gets the cookies from the server and tests is it ATSD or not using "Server" header.
 * @param address the target server's URL address
 * @param username the target user's username
 * @param password the target user's password
 */
async function performRequest(address: string, username?: string, password?: string) {
    const timeout: number = 3000; // milliseconds (3 s)
    /**
     * /api/v1/ping can be accesed only by authorized users (regardless of `api.guest.access.enabled`),
     * therefore requesting this url can kill two birds with one stone:
     *  1) check credentials;
     *  2) get jsessionid;
     */
    const path: string = (username && password) ? "/api/v1/ping" : "/login";
    const headers: Headers = (username && password) ?
        {
            "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
            "user-agent": userAgent,
        } :
        {
            "user-agent": userAgent
        };

    const options: request.RequestPromiseOptions & UriOptions = {
        headers,
        method: "GET",
        rejectUnauthorized: false, // allows self-signed certificates
        resolveWithFullResponse: true, // pass the full response to handler
        timeout,
        uri: address + path
    };

    /**
     * Prepares error specific message and throws it.
     */
    function onError(err: any) {
        if (err.statusCode != null) {
            // StatusCodeError
            const family: StatusFamily = statusFamily(err.statusCode);
            if (family === StatusFamily.CLIENT_ERROR || family === StatusFamily.SERVER_ERROR) {
                if (err.statusCode === 401) {
                    throw new Error(`Login failed with status code ${err.statusCode}`);
                } else {
                    throw new Error(`Unexpected Response Code ${err.statusCode}`);
                }
            }
        }
        // RequestError
        throw new Error(err.message);
    }

    /**
     * Sets jsessionid and atsd flag.
     */
    function onSuccess(res: IncomingMessage) {
        const cookie: string[] = res.headers["set-cookie"];
        if (!cookie || cookie.length < 1) {
            throw new Error("Cookie is empty");
        }
        jsessionid = cookie[0].split(";")[0].split("=")[1];
        const server: string | string[] | undefined = res.headers.server;
        if (!server || Array.isArray(server)) {
            atsd = false;
        } else {
            const lowerCased: string = server.toLowerCase();
            atsd = lowerCased.includes("atsd");
        }
    }

    return request(options)
        .then(onSuccess) // If request is successful and response is 2xx.
        .catch(onError); // If request failed (for example, timeout) or response is not 2xx.
}
