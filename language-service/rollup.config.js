const typescript = require("rollup-plugin-typescript");

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
        })
    ],
}