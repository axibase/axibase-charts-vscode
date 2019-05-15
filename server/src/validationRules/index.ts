import colorsThresholds from "./colorsThresholds";
import forecastEndTime from "./forecastEndTime";
import forecastSSA from "./forecastSSA";
import { ValidationRule } from "./interfaces";
import startEndTime from "./startEndTime";

const rulesBySection: ValidationRule[] = [
    {
        name: "series",
        rules: [
            colorsThresholds,
            forecastEndTime,
            forecastSSA,
            startEndTime
        ]
    }
];

export default rulesBySection;
