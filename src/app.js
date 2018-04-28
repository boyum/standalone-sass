const fs = require('fs');
const {
  promisify
} = require('util');
const path = require('path');
const sass = require('node-sass');
const nodemon = require('nodemon');
const autoprefixer = require('autoprefixer');
const recursiveReaddir = require('recursive-readdir');
const postcss = require('postcss');
const chalk = require('chalk').default;

function init(directory, options={}) {

}

/**
 * Compiles given directory
 *
 * @param {string} directory
 * @param {object} options
 * @param {boolean} options.watch If true, will watch for file changes in given directory
 * @param {boolean} options.sourceMap If true, use sourcemap
 * @param {string} options.dir Another way to pass directory
 * @param {boolean} compileOnly 
 */
async function compile(directory, options = {}, compileOnly = false) {
  const dir = directory || options.dir;

  const allFiles = await getAllFilesInDirectoryRecursive(dir);
  const sassFiles = allFiles.filter(file => path.extname(file).match(/(s[ac]ss)/ig) && !path.win32.basename(file).startsWith('_'));

  if (!sassFiles || sassFiles.length === 0) {
    console.log(chalk.red('No files were found'));
    return;
  }  

  if (!compileOnly && options.watch) {
    startNodemon(dir, options);
  }

  sassFiles.map(async file => {
    let result; 
    try {
      result = await compileSass(file, dir, Boolean(options.sourceMap));
    } catch (e) {
      console.log(`${file}: ${chalk.red(e)}`);
      return;
    }

    let css = result.css.toString('utf8');

    css = await autoprefix(css, file);

    const cssPath = file
      .replace('.scss', '.css')
      .replace('.sass', '.css');

    await promisify(fs.writeFile)(cssPath, css);

    if (options.sourceMap) {
      const sourceMapPath = cssPath + '.map';
      await promisify(fs.writeFile)(sourceMapPath, result.map.toString('utf8'));
    }
    console.log(chalk.green(`Compiled ${file} successfully`));
  });
}

/**
 * Gets all sass/scss files in given directory recursively
 *
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
function getAllFilesInDirectoryRecursive(directory) {
  return recursiveReaddir(directory);
}

/**
 * Compiles sass/scss with node-sass
 *
 * @param {string} file
 * @param {string} dest Destination directory
 * @param {boolean} sourceMap
 * @returns
 */
function compileSass(file, dest, sourceMap) {
  return promisify(sass.render)({
    file,
    outFile: `${dest}/${path.win32.basename(file)}.css`,
    outputStyle: 'compressed',
    sourceMap
  });
}

/**
 * Autoprefixes css
 * https://github.com/postcss/autoprefixer
 *
 * @param {string} css
 * @param {string} file
 * @returns {postscss.LazyResult}
 */
function autoprefix(css, file) {
  const browsers = 'ie 10, > 0.5%, last 3 versions';
  const prefixer = postcss([
    autoprefixer({
      browsers
    })
  ]);
  return prefixer.process(css, {
    from: file,
    to: sassFileToCssFile(file)
  });
}

/**
 * Updates file's extension from sass or scss to css
 *
 * @param {string} file
 * @returns {string}
 */
function sassFileToCssFile(file) {
  if (!path.extname(file).match(/s[ac]ss/ig)) {
    throw new Error('File is not a sass/scss file');
  }

  return file
    .replace('.scss', '.css')
    .replace('.sass', '.css');
}

function startNodemon(directory, options) {
  nodemon({
    script: './src/app.js',
    ext: 'scss sass',
    watch: [directory]
  });

  nodemon.on('start', () => {
    console.log(chalk.blue(`Watching sass and scss files in ${directory}.`));
  });

  nodemon.on('restart', () => {
    compile(directory, options, true);
  });
}

module.exports = {
  compile,
  sassFileToCssFile
};
