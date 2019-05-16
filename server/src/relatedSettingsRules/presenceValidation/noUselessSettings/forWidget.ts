import { Condition, isNotUselessIf } from "../../utils/condition";

/**
 * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
 */
const checks: Map<string, Condition[]> = new Map<string, Condition[]>([
    [
        "negative-style",
        /**
         * If "type!=chart" OR "mode" is NOT "column-stack" or "column",
         * settings "negative-style" and "current-period-style" are useless.
         */
        [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("mode", ["column-stack", "column"])]
    ],
    [
        "current-period-style", [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("mode", ["column-stack", "column"])]
    ],
    [
        "moving-average", [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("server-aggregate", ["false"])]
    ],
    [
        "ticks", [
            isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
            isNotUselessIf("mode", ["half", "default"])
        ]
    ],
    [
        "color-range", [
            isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
            isNotUselessIf("mode", ["half", "default"])]
    ],
    [
        "gradient-count", [
            isNotUselessIf("type", ["calendar", "treemap", "gauge"]),
            isNotUselessIf("mode", ["half", "default"])]
    ]
]);

export default checks;
