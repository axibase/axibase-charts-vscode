# Notes for contributors

## Project structure

The extension consists of two parts: client and server.

### Server

The server part includes but is not limited to:

* `Validator`: provides diagnostics against user errors such as spelling
* `completionProvider`: provides dynamically calculated completions such as `for` loop containing last declared `list` name
* `hoverProvider`: provides Hovers for settings containing a brief description of the setting
* `formatter`: provides TextEdits which should be applied to the document to make it easier to read
* `jsDomCaller`: generates statements from inline JS which are evaluated by `jsdom` package
* `resources`: reads and holds help information such as list of settings or relations between them.

### Client

The client part includes but is not limited to:

* `extension`: the entry point of the extension. Calls a language server
* `axibaseChartsProvider`: generates an HTML document which is requested by `vscode.previewHtml` command to show preview

## Building

To activate incremental compilation use `Ctrl+Shift+B`.

## Testing

### Server Testing

To run server unit-tests use `Extension Tests Server` configuration. Results are present in `Debug Console` tab.
Alternatively use `npm test` command in the root directory.

## Debugging

### Client

To debug the client part use `Launch Client` configuration. Now breakpoints are handled.

### Server

To debug the server part do the following:

* Activate `Launch Client` configuration
* Activate `Attach to Server` configuration
* Add a breakpoint.