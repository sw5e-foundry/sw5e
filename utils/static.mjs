import gulp from "gulp";
import path from "path";
import {deleteSync} from "del";

const src = "./static/"
const dest = "./dist/"

const BABELE_WATCH = ["static/babele/**/*"];
const FONTS_WATCH = ["static/fonts/**/*"];
const ICONS_WATCH = ["static/icons/**/*"];
const JSON_WATCH = ["static/json/**/*"];
const LANG_WATCH = ["static/lang/**/*"];
const PACKS_WATCH = ["static/packs/**/*"];
const TEMPLATES_WATCH = ["static/templates/**/*"];
const UI_WATCH = ["static/ui/**/*"];
const STATIC_ROOT_WATCH = ["static/system.json", "static/template.json"];
const ROOT_WATCH = ["LICENSE", "README.md", "CONTRIBUTIONS.md", "CHANGELOG.md"];

export function copyBabele() {
  return gulp.src(src + "babele/**/*")
      .pipe(gulp.dest(dest + "babele"));
}

export function copyFonts() {
  return gulp.src(src + "fonts/**/*")
    .pipe(gulp.dest(dest + "fonts"));
}

export function copyIcons() {
  return gulp.src(src + "icons/**/*")
    .pipe(gulp.dest(dest + "icons"));
}

export function copyJson() {
  return gulp.src(src + "json/**/*")
    .pipe(gulp.dest(dest + "json"));
}

export function copyLang() {
  return gulp.src(src + "lang/**/*")
    .pipe(gulp.dest(dest + "lang"));
}

export function copyPacks() {
  return gulp.src(src + "packs/**/*")
    .pipe(gulp.dest(dest + "packs"));
}

export function copyTemplates() {
  return gulp.src(src + "templates/**/*")
    .pipe(gulp.dest(dest + "templates"));
}

export function copyUi() {
  return gulp.src(src + "ui/**/*")
    .pipe(gulp.dest(dest + "ui"));
}

export function copyStaticRoot() {
  return gulp.src(src + "/*")
    .pipe(gulp.dest(dest));
}

export function copyRoot() {
  return gulp.src(["LICENSE", "README.md", "CONTRIBUTIONS.md", "CHANGELOG.md"])
    .pipe(gulp.dest(dest));
}

export function watchUpdates() {
  gulp.watch(BABELE_WATCH, copyBabele);
  gulp.watch(FONTS_WATCH, copyFonts);
  gulp.watch(ICONS_WATCH, copyIcons);
  gulp.watch(JSON_WATCH, copyJson);
  gulp.watch(LANG_WATCH, copyLang);
  gulp.watch(PACKS_WATCH, copyPacks);
  gulp.watch(TEMPLATES_WATCH, copyTemplates);
  gulp.watch(UI_WATCH, copyUi);
  gulp.watch(STATIC_ROOT_WATCH, copyStaticRoot);
  gulp.watch(ROOT_WATCH, copyRoot);

  // Deletions
  const deletions = gulp.watch([src + "**/*"], () => {})
  deletions.on("unlink", filePath => {
    const filePathFromSrc = path.relative(path.resolve(src), filePath);
    const destFilePath = path.resolve(dest, filePathFromSrc);
    deleteSync(destFilePath);
  })
}
