const gulp = require("gulp");
const less = require("gulp-less");

/* ----------------------------------------- */
/*  Compile LESS
/* ----------------------------------------- */

const SW5E_LESS = ["less/**/*.less"];

function compileLESS() {
    return gulp.src("less/original/sw5e.less").pipe(less()).pipe(gulp.dest("./"));
}

function compileGlobalLess() {
    return gulp.src("less/update/sw5e-global.less").pipe(less()).pipe(gulp.dest("./"));
}

function compileLightLess() {
    return gulp.src("less/update/sw5e-light.less").pipe(less()).pipe(gulp.dest("./"));
}

function compileDarkLess() {
    return gulp.src("less/update/sw5e-dark.less").pipe(less()).pipe(gulp.dest("./"));
}

const css = gulp.series(compileLESS, compileGlobalLess, compileLightLess, compileDarkLess);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
    gulp.watch(SW5E_LESS, css);
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = css;
gulp.parallel(css), (exports.watch = gulp.series(gulp.parallel(css), watchUpdates));
