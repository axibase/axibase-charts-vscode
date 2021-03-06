/**
 * Initial preview Script.
 * Tries to show chart, or display error's reasons as html elements.
 */
window.initChart = function () {
    const pingUrl = `${previewOptions.url}/api/v1/ping${previewOptions.jsessionid ?
        `;jsessionid=${previewOptions.jsessionid}` : ""}`;
    /**
     * Trying to ping target ATSD instance to catch SSL errors.
     */
    fetch(pingUrl, {
        method: "GET",
        mode: "no-cors"
    }).then(onSuccess)
        .catch(onError)

    function onSuccess() {
        /**
         * Execute Charts if no error has been occured.
         */
        try {
            onBodyLoad();
        } catch (err) {
            /**
             * For example, unavailable resource, see examples/fred.config.
             */
            const text = escapeHtml(err.message ? err.message : JSON.stringify(err, null, 2));
            document.body.innerHTML = `<h3>Unexpected error: </h3><code>${text}</code>`;
        }
    }

    function onError() {
        /**
         * Unable to connect to execute ping, therefore SSL issue; if api.guest.access.enabled,
         * authorization errors are catched in connectionUtils.ts -> constructConnection()).
         */
        document.body.innerHTML =
            `<h3>SSL Certificate Error during connection to ${previewOptions.url}</h3>
<p>Restart VSCode with <code>--ignore-certificate-errors</code> flag or add the self-signed certificate to root CAs. 
See <a href="https://github.com/axibase/axibase-charts-vscode#ssl-certificates"> this note </a> for more information.</p>`;
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}