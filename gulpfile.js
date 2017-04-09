var gulp = require('gulp');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var csso = require('gulp-csso');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace'); //版本号替换
var useref = require('gulp-useref'); //解析html资源定位
var filter = require('gulp-filter');
// 编译sass
gulp.task('src:css', function () {
    gulp.src('src/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .on('error', sass.logError)
        .pipe(autoprefixer({
            browsers: ['last 10 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write(''))
        .pipe(gulp.dest('src/css'))
});
// 构建css
gulp.task('dist:css', function () {
    del('dist/css/*');
    gulp.src('src/sass/**/*.scss')
        .pipe(concat('style.css'))
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .pipe(autoprefixer({
            browsers: ['last 10 versions'],
            cascade: false
        }))
        .pipe(csso())
        .pipe(gulp.dest('dist/css'))
})
//压缩图片
gulp.task('dist:img', function () {
    gulp.src('src/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
})

// 构建js
gulp.task('dist:js', function () {
    del('dist/js/*');
    pump([
        gulp.src('src/js/*.js'),
        // uglify(),
        concat('index.js'),
        gulp.dest('dist/js')
    ])
})
//生成版本号
gulp.task("revision", function () {
    gulp.src(["dist/css/*.css", "dist/js/*.js"])
        .pipe(rev())
        .pipe(gulp.dest('dist'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('dist'))
})

//打包1
gulp.task('index', ['revision'], function () {
    var manifest = gulp.src("./dist/rev-manifest.json");
    return gulp.src("src/index.html")
        .pipe(revReplace({
            manifest: manifest
        }))
        .pipe(gulp.dest('dist'));
})
//打包2
gulp.task("build", function () {
    var jsFilter = filter('**/*.js', {
        restore: true
    });
    var cssFilter = filter('**/*.css', {
        restore: true
    });
    var indexHtmlFilter = filter(['**/*', '!**/index.html'], {
        restore: true
    });
    gulp.src("src/index.html")
        .pipe(useref())
        .pipe(jsFilter)
        .pipe(uglify()) // Minify any javascript sources 
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(csso()) // Minify any CSS sources 
        .pipe(cssFilter.restore)
        .pipe(indexHtmlFilter)
        .pipe(rev())
        .pipe(indexHtmlFilter.restore)
        .pipe(revReplace())
        .pipe(gulp.dest('dist'));
});
// 启动服务器
gulp.task('connect', function () {
    connect.server({
        root: 'src',
        livereload: true
    });
});

// 刷新src html
gulp.task('reload', function () {
    gulp.src('src/*.html')
        .pipe(connect.reload());
});

// 监控所有文件 发生变动 执行reload
gulp.task('change', function () {
    gulp.watch(['src/**/*'], ['src:css', 'reload'])
})
// gulp.task("watch", function () {
//     gulp.watch('src/**/*.less', ['src:css'])
// })
gulp.task('server', ['connect', 'change']);