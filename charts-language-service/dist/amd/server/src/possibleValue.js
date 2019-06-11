define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PossibleValue {
        constructor(value, detail) {
            /**
             * Description of value
             */
            this.detail = "";
            this.value = value;
            this.detail = detail;
        }
    }
    exports.PossibleValue = PossibleValue;
});
