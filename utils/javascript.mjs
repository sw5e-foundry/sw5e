import eslint from "gulp-eslint7";
import gulp from "gulp";
import gulpIf from "gulp-if";
import mergeStream from "merge-stream";
import yargs from "yargs";

import { rollup } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import terser from "@rollup/plugin-terser";

import packageJSON from "../package.json" assert { type: "json" };

/**
 * Parsed arguments passed in through the command line.
 * @type {object}
 */
const parsedArgs = yargs(process.argv).argv;

/**
 * Paths of javascript files that should be linted.
 * @type {string[]}
 */
const LINTING_PATHS = ["./sw5e.mjs", "./module/"];
const JAVSCRIPT_DEST = "./dist";
const JAVASCRIPT_WATCH = ["module/**/*.mjs", "sw5e.mjs"];


/**
 * Compile javascript source files into a single output file.
 *
 * - `gulp buildJS` - Compile all javascript files into into single file & build source maps.
 */
async function compileJavascript() {
  const config = {
    input: "./sw5e.mjs",
    plugins: [
      nodeResolve(),
      commonjs()
    ]
  }

  if (parsedArgs.prod) {
    config.plugins.push(terser())
  }

  const outputConfig = {
    dir: JAVSCRIPT_DEST,
    chunkFileNames: "[name].mjs",
    entryFileNames: "sw5e.mjs",
    sourcemap: !parsedArgs.prod,
    manualChunks: {
      "vendor": Object.keys(packageJSON.dependencies)
    },
    format: "es",
  }

  const bundle = await rollup(config);
  await bundle.write(outputConfig);
}
export const compile = compileJavascript;


/**
 * Lint javascript sources and optionally applies fixes.
 *
 * - `gulp lint` - Lint all javascript files.
 * - `gulp lint --fix` - Lint and apply available fixes automatically.
 */
function lintJavascript() {
  const applyFixes = !!parsedArgs.fix;
  const tasks = LINTING_PATHS.map(path => {
    const src = path.endsWith("/") ? `${path}**/*.mjs` : path;
    const dest = path.endsWith("/") ? path : `${path.split("/").slice(0, -1).join("/")}/`;
    return gulp
      .src(src)
      .pipe(eslint({fix: applyFixes}))
      .pipe(eslint.format())
      .pipe(gulpIf(file => file.eslint != null && file.eslint.fixed, gulp.dest(dest)));
  });
  return mergeStream(tasks);
}
export const lint = lintJavascript;

export function watchUpdates() {
  gulp.watch(JAVASCRIPT_WATCH, compileJavascript);
}
