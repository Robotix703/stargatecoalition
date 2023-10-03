const gulp = require('gulp');
const zip = require('gulp-zip');
const less = require('gulp-less');

function copyForZip() {
	return gulp.src(['**/*', '!build/*', '!build', '!node_modules', '!./gulpfile.js', '!LICENSE', '!package.json', '!package-lock.json', '!.gitignore'])
		.pipe(gulp.dest('build'))
}

/* ----------------------------------------- */
/*  Compile LESS
/* ----------------------------------------- */

function compileLESS() {
  	return gulp.src("styles/stargatecoalition.less")
		.pipe(less())
		.pipe(gulp.dest("./styles/"))
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(
	compileLESS,
	copyForZip
);