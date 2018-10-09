# Notes for Contributors

## Project Structure

The extension consists of two parts: **Client** and **Server**.

### Server

The **Server** part includes but is not limited to:

* `Validator`: Provides diagnostics for user errors such as spelling.
* `completionProvider`: Provides dynamically calculated completions, such as `for` loop which contains last declared `list` name.
* `hoverProvider`: Provides `Hovers` for settings containing a brief description of the setting.
* `formatter`: Provides `TextEdits` which make the document easier to read.
* `jsDomCaller`: Generates statements from inline JS which are evaluated by `jsdom` package.
* `resources`: Reads and holds helpful information, such as list of settings or relations between them.

### Client

The **Client** part includes but is not limited to:

* `extension`: The entry point of the extension. Calls a language server.
* `axibaseChartsProvider`: Generates an HTML document which is requested by `vscode.previewHtml` command to show preview.

## Building

To activate incremental compilation use `Ctrl+Shift+B`.

## Testing

### Server Testing

To run server unit-tests use `Extension Tests Server` configuration. Results are present in `Debug Console` tab.
> Alternatively use `npm test` command in the root directory.

## Debugging

### Client

To debug the **Client** part use `Launch Client` configuration, breakpoints are handled.

### Server

To debug the **Server** part:

* Activate `Launch Client` configuration
* Activate `Attach to Server` configuration
* Add a breakpoint.