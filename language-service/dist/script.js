(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Script = /** @class */ (function () {
        function Script(returnValue, fields) {
            if (fields === void 0) { fields = []; }
            this.returnValue = returnValue;
            this.fields = fields;
        }
        return Script;
    }());
    exports.Script = Script;
});
