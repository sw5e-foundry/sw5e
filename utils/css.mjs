import gulp from "gulp";
import less from "gulp-less";


const LESS_DEST = "./";
const LESS_WATCH = ["less/**/*.less"];


/**
 * Compile the LESS sources into a single CSS file.
 */
function compileLESS(less_src) {
  return gulp.src(less_src)
    .pipe(less())
    .pipe(gulp.dest(LESS_DEST));
}


function compileLess() { return compileLESS("less/original/sw5e.less"); }
function compileGlobalLess() { return compileLESS("less/update/sw5e-global.less"); }
function compileLightLess() { return compileLESS("less/update/sw5e-light.less"); }
function compileDarkLess() { return compileLESS("less/update/sw5e-dark.less"); }

export const compile = gulp.series(compileLess, compileGlobalLess, compileLightLess, compileDarkLess);


/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

export function watchUpdates() {
  gulp.watch(LESS_WATCH, compile);
}
