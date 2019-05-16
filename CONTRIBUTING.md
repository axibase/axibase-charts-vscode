# Notes for Contributors

## Project Structure

The extension consists of two parts: **Client** and **Server**.

### Server

The **Server** part includes but is not limited to:

* `validator`: Provides diagnostics for user errors such as spelling.
* `completionProvider`: Provides dynamically calculated completions, such as `for` loop which contains last declared `list` name.
* `hoverProvider`: Provides `Hovers` for settings containing a brief description of the setting.
* `formatter`: Provides `TextEdits` which make the document easier to read.
* `javaScriptValidator`: Generates statements from inline JS which are evaluated by `jsdom` package.
* `resources`: Reads and holds helpful information, such as list of settings or relations between them.
* `relatedSettingsRules`: Contains rules, which perform checks of relations between settings:
  * [`presenceValidation`](server/src/relatedSettingsRules/presenceValidation) contains two types of rules:

    1. [`noUselessSettings`](server/src/relatedSettingsRules/presenceValidation/noUselessSettings/index.ts) - these rules check that there are no useless settings in the config, for example, `forecast-arima-d` is useless if `forecast-arima-auto = true` ;
    2. [`requiredSettings`](server/src/relatedSettingsRules/presenceValidation/requiredSettings.ts) - these rules check that there are settings, which are required if particular conditions are met, for example, `node-alert-style` has no effect without `alert-expression` if `type` of config is `graph`.
  * [`valueValidation`](server/src/relatedSettingsRules/valueValidation) contains rules, which check relations between values of the settings, for example, `startEndTime.ts` checks that `start-time` is greater than `end-time`.

Rules are grouped by deepest section of settings, which are used in rule, see [relatedSettingsRules/index.ts](server/src/relatedSettingsRules/index.ts).

### Client

The **Client** part includes but is not limited to:

* [`extension`](client/src/extension.ts): The entry point of the extension. Calls a language server.
* [`panelContentProvider`](client/src/panelContentProvider.ts#L14): Provides functionality for [Webview API](https://code.visualstudio.com/api/extension-guides/webview): creates `WebviewPanel` and manages it's HTML content to allow preview portals.

#### [axibasecharts.showPortal](client/src/extension.ts#L119)

Portal preview is implemented using [Webview API](https://code.visualstudio.com/api/extension-guides/webview).

Major part of libraries, required for visualization, placed in `client/resources`, to ensure access to them, their paths are updated with `vscode-resource` scheme in [`extensionPath`](client/src/panelContentProvider.ts#L114) method. To restrict access to other files in local filesystem from Webview, [`localResourceRoots`](client/src/extension.ts#L147) is used.

Other files (at least `charts.min.js`) are loaded from ATSD instance, see [`getHtml`](client/src/panelContentProvider.ts#L121) and [`resource`](client/src/panelContentProvider.ts#L193) methods. `initChart()` from [init.js](client/resources/js/init.js) provides a way to catch self-signed SSL certificate issues.

## Building

To build sources run `npm run compile`.
To activate incremental compilation use `Ctrl+Shift+B`.

## Testing

### Server Testing

To run server unit-tests use `Extension Tests Server` configuration. Results are present in `Debug Console` tab.

> Alternatively use `npm test` command.

## Debugging

### Client

To debug the **Client** part use `Launch Client` configuration, breakpoints are handled.

### Server

To debug the **Server** part:

* Activate `Launch Client` configuration
* Activate `Attach to Server` configuration
* Add a breakpoint.