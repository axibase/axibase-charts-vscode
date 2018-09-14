/**
 * Initialize portal with config from
 */
if (typeof initializePortal === "function") {
    console.log(previewOptions);
    initializePortal(function (callback) {
        var configText = previewOptions.text;
        if (typeof callback === "function") {
            callback([configText, portalPlaceholders = getPortalPlaceholders()]);
        }
    });
}
