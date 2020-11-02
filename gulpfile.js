const gulp = require('gulp');
const less = require('gulp-less');

/* ----------------------------------------- */
/*  Compile LESS
/* ----------------------------------------- */

const SW5E_LESS = ["less/**/*.less"];
function compileLESS() {
  return gulp.src("less/original/sw5e.less")
    .pipe(less())
    .pipe(gulp.dest("./"))
}
function compileMORE() {
  return gulp.src("less/update/sw5e-update.less")
    .pipe(less())
    .pipe(gulp.dest("./"))
}
const css = gulp.series(compileLESS, compileMORE);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
  gulp.watch(SW5E_LESS, css);
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(
  gulp.parallel(css),
  watchUpdates
);
exports.css = css;
