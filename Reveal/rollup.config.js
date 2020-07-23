import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";

const pkg = require("./package.json");

export default {
    input: "src/Reveal.svelte",
    output: [
        { file: pkg.module, format: "esm" },
        { file: pkg.main, format: "esm", name: "Reveal" },
    ],
    plugins: [svelte(), resolve()],
};
