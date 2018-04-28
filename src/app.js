const fs = require('fs');
const {
  promisify
} = require('util');
const path = require('path');
const sass = require('node-sass');
const sassimports = require('node-sass-imports');
const nodemon = require('nodemon');
const autoprefixer = require('autoprefixer');
const recursiveReaddir = require('recursive-readdir');
const postcss = require('postcss');
const chalk = require('chalk').default;

class StandaloneSass {
  constructor(options, ...directories) {
    /** @type {Array<string>} */
    this.directories = directories || [...options.dir];
    /** @type {Map<string, Array<string>>} */
    this.fileMap;
    this.options = options || {
      watch: false,
      sourceMap: false,
      dir: '.'
    };

    this.init();
  }

  async init() {
    const dir = this.directories[0];
    
    const allFiles = await this.getAllFilesInDirectoryRecursive(dir);
    const sassFiles = allFiles.filter(file => path.extname(file).match(/(s[ac]ss)/ig) && !path.win32.basename(file).startsWith('_'));

    if (!sassFiles || sassFiles.length === 0) {
      console.log(chalk.red('No files were found'));
      return;
    }

    this.fileMap = new Map(sassFiles.map(file => [file, sassimports(file)]));

    if (this.options.watch) {
      this.watch(dir);
    }
    
    this.compile();
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
  async compile(changedFiles = []) {
    console.log('compiling');
    const dir = this.directories[0];

    this.fileMap.forEach(async (sassDependencies, sassFile) => {
      if (changedFiles.length === 0 || (changedFiles.length > 0 && this.arraysHaveCommonItems(changedFiles, sassDependencies))) {
        let result;
        try {
          result = await this.compileSass(file, dir, Boolean(this.options.sourceMap));
        } catch (e) {
          console.log(`${file}: ${chalk.red(e)}`);
          return;
        }

        let css = result.css.toString('utf8');

        css = await this.autoprefix(css, file);

        const cssPath = file
          .replace('.scss', '.css')
          .replace('.sass', '.css');

        await promisify(fs.writeFile)(cssPath, css);

        if (options.sourceMap) {
          const sourceMapPath = cssPath + '.map';
          await promisify(fs.writeFile)(sourceMapPath, result.map.toString('utf8'));
        }
        console.log(chalk.green(`Compiled ${file} successfully`));
      }
    });
  }

  /**
   * Gets all sass/scss files in given directory recursively
   *
   * @param {string} directory
   * @returns {Promise<string[]>}
   */
  getAllFilesInDirectoryRecursive(directory) {
    return recursiveReaddir(directory);
  }

  arraysHaveCommonItems(array1, array2) {
    return array1.some(el => {
      return array2.includes(el);
    });
  }

  /**
   * Compiles sass/scss with node-sass
   *
   * @param {string} file
   * @param {string} dest Destination directory
   * @param {boolean} sourceMap
   * @returns
   */
  compileSass(file, dest, sourceMap) {
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
  autoprefix(css, file) {
    const browsers = 'ie 10, > 0.5%, last 3 versions';
    const prefixer = postcss([
      autoprefixer({
        browsers
      })
    ]);
    return prefixer.process(css, {
      from: file,
      to: this.sassFileToCssFile(file)
    });
  }

  /**
   * Updates file's extension from sass or scss to css
   *
   * @param {string} file
   * @returns {string}
   */
  sassFileToCssFile(file) {
    if (!path.extname(file).match(/s[ac]ss/ig)) {
      throw new Error('File is not a sass/scss file');
    }

    return file
      .replace('.scss', '.css')
      .replace('.sass', '.css');
  }

  watch(directory) {
    nodemon({
      script: './src/app.js',
      ext: 'scss sass',
      watch: [directory]
    });

    nodemon.on('start', () => {
      console.log(chalk.blue(`Watching sass and scss files in ${directory}.`));
    });

    nodemon.on('restart', (changedFiles) => {
      this.compile(changedFiles);
    });
  }
}



module.exports = StandaloneSass;