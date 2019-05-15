import { ValidationRule } from "../configTree";

import colorsThresholds from "./colorsThresholds";
import forecastEndTime from "./forecastEndTime";
import forecastSSA from "./forecastSSA";
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
