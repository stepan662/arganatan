import path from "path";
import { fileURLToPath } from "url";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: path.resolve(__dirname, "lib/src/index.ts"),
  external: ["react", "react-dom"],
  plugins: [
    resolve({ extensions: [".js", ".ts", ".tsx"] }),
    commonjs(),
    typescript({
      tsconfig: path.resolve(__dirname, "lib/src/tsconfig.json"),
      declaration: true,
      declarationDir: path.resolve(__dirname, "lib/src/dist"),
      rootDir: path.resolve(__dirname, "lib/src"),
      sourceMap: true,
      jsx: "react-jsx",
    }),
  ],
  output: [
    {
      file: path.resolve(__dirname, "lib/src/dist/index.esm.js"),
      format: "esm",
      sourcemap: true,
    },
    {
      file: path.resolve(__dirname, "lib/src/dist/index.cjs.js"),
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
  ],
};
