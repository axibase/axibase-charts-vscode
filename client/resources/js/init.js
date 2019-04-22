/**
 * Initial preview Script.
 * Tries to show chart, or display error's reasons as html elements.
 */
window.initChart = function () {
    const pingUrl = `${previewOptions.url}/api/v1/ping${previewOptions.jsessionid ?
        `;jsessionid=${previewOptions.jsessionid}` : ""}`;
    /**
     * Trying to ping target ATSD instance to catch SSL and other errors.
     */
    fetch(pingUrl, {
        method: "GET",
        mode: "no-cors"
    }).then((response) => {
        if (response.status !== 0) {
            /**
             * Execute Charts if no error has been occured.
             */
            onBodyLoad();
        } else {
            /**
             * api.guest.access.enabled=false and no credentials are specified.
             */
            document.body.style.color = previewOptions.textColor;
            document.body.innerHTML = `<h3>Unexpected error: ${JSON.stringify(response, null, 2)}</h3>
            <p>Try to set <code><a href="https://axibase.com/docs/atsd/administration/user-authentication.html#guest-access-to-data-api">api.guest.access.enabled</a></code>
            or specify <a href="https://github.com/axibase/axibase-charts-vscode#live-preview"> credentials</a>.</p>`;
        }
    }).catch((err) => {
        document.body.style.color = previewOptions.textColor;
        if ($.isEmptyObject(err)) {
            /**
             * Empty error body means SSL issue; if api.guest.access.enabled, authorization errors catched in handleResponse().
             */
            document.body.innerHTML = `<h3>SSL Certificate Error during connection to ${previewOptions.url}</h3>
    <p>Restart VSCode with <code>--ignore-certificate-errors</code> flag or add the self-signed 
    certificate to root CAs. 
    See <a href="https://github.com/axibase/axibase-charts-vscode#ssl-certificates"> this note </a> 
    for more information.</p>`;
        } else {
            /**
             * For example, unavailable resource, see examples/fred.config.
             */
            document.body.innerHTML = `<h3>Unexpected error: </h3><code>${JSON.stringify(err, null, 2)}</code>`;
        }
    });
};