define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Script {
        constructor(returnValue, fields = []) {
            this.returnValue = returnValue;
            this.fields = fields;
        }
    }
    exports.Script = Script;
});
