const typescript = require("rollup-plugin-typescript");
const json = require("rollup-plugin-json");
const resolve = require("rollup-plugin-node-resolve");

module.exports = {
    input: "src/index.ts",
    external: ["vscode-languageserver-types"],
    output: {
        file: "dist/amd/axibase-charts-languageservice.js",
        format: "amd",
        amd: {
            id: "axibase-charts-languageservice"
        }
    },
    plugins: [
        typescript({
            module: "esnext",
            target: "es5"
        }),
        json(),
        resolve({
            extensions: ['.js', '.json'],
        }),
    ],
}