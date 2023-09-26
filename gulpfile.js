const gulp = require('gulp');
const zip = require('gulp-zip');

exports.default = () => (
	gulp.src(['*', '!build', '!node_modules', '!./gulpfile.js', '!LICENSE', '!package.json', '!package-lock.json', '!.gitignore'])
		.pipe(zip('stargatecoalition.zip'))
		.pipe(gulp.dest('build'))
);