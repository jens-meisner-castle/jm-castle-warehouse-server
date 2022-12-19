import eslint from "@rbnlffl/rollup-plugin-eslint";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import analyze from "rollup-plugin-analyzer";
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";
import multiInput from "rollup-plugin-multi-input";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import styles from "rollup-plugin-styles";
import svg from "rollup-plugin-svg";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

export default {
  input: [
    "src/auth/**/*.*",
    "src/charts/**/*.*",
    "src/components/**/*.*",
    "src/configuration/**/*.*",
    "src/filter/**/*.*",
    "src/hooks/**/*.*",
  ],
  output: [
    {
      dir: pkg.main,
      format: "cjs",
      exports: "named",
      sourcemap: true,
    },
  ],
  external: ["fs"],
  plugins: [
    excludeDependenciesFromBundle(),
    multiInput({ relative: "src/" }),
    json(),
    svg(),
    peerDepsExternal(),
    nodeResolve({ preferBuiltins: true }),
    commonjs({
      include: ["node_modules/**"],
    }),
    eslint(
      {},
      { exclude: ["node_modules", "./node_modules/**", "src/PrepareModule.js"] }
    ),
    typescript({
      rollupCommonJSResolveHack: true,
      exclude: "**/__tests__/**",
      clean: true,
    }),
    styles(),
    replace({
      preventAssignment: true,
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    analyze({ summaryOnly: true }),
  ],
};
