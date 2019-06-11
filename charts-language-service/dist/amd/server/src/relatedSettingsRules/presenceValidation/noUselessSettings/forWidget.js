define(["require", "exports", "../../utils/condition"], function (require, exports, condition_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
     */
    const checks = new Map([
        [
            "negative-style",
            /**
             * If "type!=chart" OR "mode" is NOT "column-stack" or "column",
             * settings "negative-style" and "current-period-style" are useless.
             */
            [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("mode", ["column-stack", "column"])
            ]
        ],
        [
            "current-period-style", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("mode", ["column-stack", "column"])
            ]
        ],
        [
            "moving-average", [
                condition_1.isNotUselessIf("type", ["chart"]),
                condition_1.isNotUselessIf("server-aggregate", ["false"])
            ]
        ],
        [
            "ticks", [
                condition_1.isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
                condition_1.isNotUselessIf("mode", ["half", "default"])
            ]
        ],
        [
            "color-range", [
                condition_1.isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
                condition_1.isNotUselessIf("mode", ["half", "default"])
            ]
        ],
        [
            "gradient-count", [
                condition_1.isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
                condition_1.isNotUselessIf("mode", ["half", "default"])
            ]
        ]
    ]);
    exports.default = checks;
});
