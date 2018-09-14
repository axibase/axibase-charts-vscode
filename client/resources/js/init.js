/**
 * Initial preview Script.
 * Tries to show chart, or display error's reasons as html elements.
 */
window.initChart = function () {
    const pingUrl = `${previewOptions.url}/api/v1/ping${previewOptions.jsessionid ?
        `;jsessionid=${previewOptions.jsessionid}` : ""}`;
    $.get(pingUrl, () => {
        if (onBodyLoad) {
            onBodyLoad();
        } else {
            const $body = $('body');
            $body.empty().append('<h3>Corrupted charts.js files</h3>');
        }
    }).fail(err => {
        console.log(err);
        const $body = $('body');
        if (err.status === 0) {
            $body.empty();
            $body.append(`<h3>SSL Certificate Error during connection to ${previewOptions.url}</h3>
                    <p>Restart VSCode with <code>--ignore-certificate-errors</code> flag or add the self-signed 
                    certificate to root CAs. 
                    See <a href="https://github.com/axibase/axibase-charts-vscode#ssl-certificates"> this note </a> 
                    for more information.</p>`);
        } else {
            if (onBodyLoad) {
                onBodyLoad();
            } else {
                $body.empty()
                    .append(`<h3> Unexpected error: </h3><code>${JSON.stringify(err, null, 2)}</code>`)
            }
        }
    });
};
