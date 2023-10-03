const gulp = require('gulp');
const zip = require('gulp-zip');
const less = require('gulp-less');

function createZip() {
	return gulp.src(['**/*', '!build', '!node_modules', '!./gulpfile.js', '!LICENSE', '!package.json', '!package-lock.json', '!.gitignore'])
		.pipe(zip('stargatecoalition.zip'))
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
	compileLESS
);