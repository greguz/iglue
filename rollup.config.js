import tsPlugin from "rollup-plugin-typescript";
import tsCompiler from "typescript";

export default {
  input: "src/index.ts",
  plugins: [
    tsPlugin({
      typescript: tsCompiler
    })
  ]
}
