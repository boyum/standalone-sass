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

class StandaloneSass {
  async init(options, ...directories) {
    /** @type {Array<string>} */
    this.directories = directories || [...options.dir];
    /** @type {Map<string, Array<string>>} */
    this.fileMap = null;
    this.options = options || {
      watch: false,
      sourceMap: false,
      dir: '.'
    };

    const dir = this.directories[0];

    const allFiles = await this.getAllFilesInDirectoryRecursive(dir);
    const sassFiles = allFiles.filter(file => path.extname(file).match(/(s[ac]ss)/ig) && !path.win32.basename(file).startsWith('_'));

    if (!sassFiles || sassFiles.length === 0) {
      console.log(chalk.red('No files were found'));
      return;
    }

    this.fileMap = new Map(sassFiles.map(file => [file, []]));

    if (this.options.watch) {
      this.watch(dir);
    }

    this.compile();
  }

  /**
   * Compiles given directory
   *
   * @param {Array<string>} changedFiles
   */
  async compile(changedFiles = []) {
    const dir = this.directories[0];

    this.fileMap.forEach(async (sassDependencies, sassFile) => {
      if (changedFiles.length === 0 || (changedFiles.length > 0 && this.arraysHaveCommonItems(changedFiles, sassDependencies))) {
        let result;
        try {
          result = await this.compileSass(sassFile, dir, Boolean(this.options.sourceMap));
        } catch (e) {
          console.log(`${sassFile}: ${chalk.red(e)}`);
          return;
        }

        this.fileMap.set(sassFile, result.stats.includedFiles);

        let css = result.css.toString('utf8');

        css = await this.autoprefix(css, sassFile);

        const cssPath = sassFile
          .replace('.scss', '.css')
          .replace('.sass', '.css');

        await promisify(fs.writeFile)(cssPath, css);

        if (this.options.sourceMap) {
          const sourceMapPath = cssPath + '.map';
          await promisify(fs.writeFile)(sourceMapPath, result.map.toString('utf8'));
        }
        console.log(chalk.green(`Compiled ${sassFile} successfully`));
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

  /**
   * Returns true if any elements in the two arrays are equal strings (case-insensitive)
   *
   * @param {Array<string>} array1
   * @param {Array<string>} array2
   */
  arraysHaveCommonItems(array1, array2) {
    return array1.some(el => {
      return array2.some(el2 => el.toUpperCase() === el2.toUpperCase());
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

    console.log(chalk.blue(`Watching sass and scss files in ${directory}.`));

    nodemon.on('start', () => {
    });

    nodemon.on('restart', changedFiles => {
      this.compile(changedFiles.map(file => file.replace(/\\/ig, '/')));
    });
  }
}

module.exports = StandaloneSass;
