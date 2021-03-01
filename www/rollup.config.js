import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";

const DEV_MODE = !!process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn(
        "npm",
        ["run", "start", "--", "--dev"],
        {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        }
      );
      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

export default [
  {
    input: "src/routes/app.ts",
    output: {
      file: "build/app.js",
      format: "iife",
      sourcemap: DEV_MODE,
    },
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        sourceMap: DEV_MODE,
        inlineSources: DEV_MODE,
        target: "ES2019",
        moduleResolution: "node",
      }),
      DEV_MODE && serve(),
      DEV_MODE && livereload("build"),
      !DEV_MODE && terser(),
      copy({
        targets: [{ src: "public/*", dest: "build/" }],
      }),
    ],
  },
  {
    input: "src/routes/index.ts",
    output: {
      file: "build/index.js",
      format: "iife",
      sourcemap: DEV_MODE,
    },
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      typescript({
        sourceMap: DEV_MODE,
        inlineSources: DEV_MODE,
        target: "ES2019",
      }),
      !DEV_MODE && terser(),
    ],
  },
];
