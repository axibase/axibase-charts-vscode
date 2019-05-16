import { Condition, isNotUselessIf } from "../../utils/condition";

/**
 * If key is declared in the section and the section doesn't match any of conditions, then key is useless.
 */
const checks: Map<string, Condition[]> = new Map<string, Condition[]>([
    [
        "forecast-arima-auto-regression-interval", [
        /**
         * If "type!=chart" OR "forecast-arima-auto=true",
         * setting "forecast-arima-auto-regression-interval" is useless.
         */
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("forecast-arima-auto", ["false"])]
    ],
    [
        "forecast-arima-d", [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("forecast-arima-auto", ["false"])]
    ],
    [
        "forecast-arima-p", [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("forecast-arima-auto", ["false"])]
    ],
    [
        "forecast-hw-alpha", [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("forecast-hw-auto", ["false"])]
    ],
    [
        "forecast-hw-beta", [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("forecast-hw-auto", ["false"])]
    ],
    [
        "forecast-hw-gamma", [
            isNotUselessIf("type", ["chart"]),
            isNotUselessIf("forecast-hw-auto", ["false"])]
    ]
]);

export default checks;
