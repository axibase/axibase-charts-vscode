define(["require", "exports", "../../utils/condition"], function (require, exports, condition_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
     */
    const checks = new Map([
        [
            "forecast-arima-auto-regression-interval", [
                /**
                 * If "type!=chart" OR "forecast-arima-auto=true",
                 * setting "forecast-arima-auto-regression-interval" is useless.
                 */
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-arima-auto", ["false"])
            ]
        ],
        [
            "forecast-arima-d", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-arima-auto", ["false"])
            ]
        ],
        [
            "forecast-arima-p", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-arima-auto", ["false"])
            ]
        ],
        [
            "forecast-hw-alpha", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-hw-auto", ["false"])
            ]
        ],
        [
            "forecast-hw-beta", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-hw-auto", ["false"])
            ]
        ],
        [
            "forecast-hw-gamma", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("forecast-hw-auto", ["false"])
            ]
        ]
    ]);
    exports.default = checks;
});
