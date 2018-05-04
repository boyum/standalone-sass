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
  /**
   * Initializes compiler with options, and files and directories
   *
   * @param {object} options
   * @param {boolean} options.watch
   * @param {boolean} options.sourceMap
   * @param {string} options.dir
   * @param {string} options.file
   * @param {string[]} [directoriesAndFiles=[]]
   * @param {boolean} [doCompile=true]
   * @returns {void}
   * @memberof StandaloneSass
   */
  async init(options, directoriesAndFiles = [], doCompile = true) {
    /** @type {Map<string, string[]>} */
    this.fileMap = null;
    this.options = options || {
      watch: false,
      sourceMap: false,
      dir: '',
      file: ''
    };

    /** @type {string[]} */
    this.directoriesAndFiles = directoriesAndFiles.filter(async item => (await promisify(fs.lstat)(item)).isDirectory()) || options.dir;
    if (this.options.dir) {
      this.directoriesAndFiles = this.directoriesAndFiles.concat(this.options.dir);
    }

    let sassFiles = [];

    if (this.directoriesAndFiles.length > 0) {
      let allFiles = [];

      await this.directoriesAndFiles.forEach(async dir => {
        try {
          const files = await this.getAllFilesInDirectoryRecursive(dir);
          allFiles = allFiles.concat(files);
        } catch (e) {
          if (e.code === 'ENOTDIR') {
            allFiles = allFiles.concat(dir);
          } else {
            console.error(e);
          }
        }
      });

      await sleep(100);

      sassFiles = allFiles.filter(file => path.extname(file).match(/(s[ac]ss)/ig) && !path.win32.basename(file).startsWith('_'));
    }

    if (this.options.file) {
      sassFiles.push(this.options.file);
    }

    if (!sassFiles || sassFiles.length === 0) {
      console.log(chalk.red('No files were found'));
      return;
    }

    this.fileMap = new Map(sassFiles.map(file => [file, []]));

    /* istanbul ignore if */
    if (this.options.watch) {
      this.watch(this.directoriesAndFiles);
    }

    /* istanbul ignore if */
    if (doCompile) {
      this.compile();
    }
  }

  /**
   * Compiles given directory
   *
   * @param {string[]} changedFiles
   */
  async compile(changedFiles = []) {
    if (this.fileMap === null) {
      return;
    }

    this.fileMap.forEach(async (sassDependencies, sassFile) => {
      if (changedFiles.length === 0 || (changedFiles.length > 0 && this.arraysHaveCommonItems(changedFiles, sassDependencies))) {
        let result;
        const dir = path.dirname(sassFile);
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

        /* istanbul ignore if */
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
   * @param {string[]} array1
   * @param {string[]} array2
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

  /* istanbul ignore next */
  watch(directoriesAndFiles) {
    nodemon({
      script: './src/app.js',
      ext: 'scss sass',
      watch: directoriesAndFiles
    });

    console.log(chalk.blue(`Watching sass and scss files in ${directoriesAndFiles}.`));

    nodemon.on('start', () => {
    });

    nodemon.on('restart', changedFiles => {
      this.compile(changedFiles.map(file => file.replace(/\\/ig, '/')));
    });
  }
}

function sleep(millis) {
  return new Promise(resolve => {
    setTimeout(resolve, millis);
  });
}

module.exports = StandaloneSass;
