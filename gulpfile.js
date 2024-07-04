import gulp from "gulp";

import * as css from "./utils/css.mjs";
import * as javascript from "./utils/javascript.mjs";
import * as packs from "./utils/packs.mjs";
import * as staticGulp from "./utils/static.mjs";
import {deleteAsync} from "del";
import {existsSync} from "fs";
import {mkdir} from "fs/promises"

function cleanDist() {
  return deleteAsync(["dist/**", "!dist/.gitkeep"], {force: true});
}

async function ensureDist() {
  if (!existsSync("dist")) return mkdir("dist");
  else return Promise.resolve();
}

// Clean
export const clean = gulp.series(cleanDist, ensureDist);

// Javascript compiling & linting
export const buildJS = gulp.series(javascript.compile);
export const lint = gulp.series(javascript.lint);

// CSS compiling
export const buildCSS = gulp.series(css.compile);

// Compendium pack management
export const cleanPacks = gulp.series(packs.clean);
export const compilePacks = gulp.series(packs.compile);
export const extractPacks = gulp.series(packs.extract);

// Static copy
export const copyStatic = gulp.parallel(
  staticGulp.copyBabele,
  staticGulp.copyFonts,
  staticGulp.copyIcons,
  staticGulp.copyJson,
  staticGulp.copyLang,
  staticGulp.copyPacks,
  staticGulp.copyTemplates,
  staticGulp.copyTokens,
  staticGulp.copyUi,
  staticGulp.copyStaticRoot,
  staticGulp.copyRoot
);

// Build all artifacts
export const buildAll = gulp.series(
  clean,
  gulp.parallel(
    css.compile,
    javascript.compile,
    packs.compile,
    copyStatic
  )
);

// Watch for updates
export const watchUpdates = gulp.series(
  buildAll,
  gulp.parallel(
    css.watchUpdates,
    javascript.watchUpdates,
    staticGulp.watchUpdates
  )
);

// Default export - watch
export default watchUpdates;
