# Notes for contributors

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