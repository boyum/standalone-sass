const fs = require('fs');
const {
  promisify
} = require('util');
const test = require('ava');
const rimraf = require('rimraf');
const StandaloneSass = require('../src/app');

/** @type StandaloneSass */
let compiler;

test.before(async () => {
  await setupStylesDirectory();

  compiler = new StandaloneSass();
  await compiler.init({
    watch: false,
    sourceMap: false,
    dir: '.'
  }, ['test/styles'], false);
});

test.after(async () => {
  await deleteStylesDirectory();
});

test('`sassFileToCssFile()` replaces sass file extension with `css`', t => {
  const sassPath = 'path/to/sass/file/sass.sass';
  const cssPath = compiler.sassFileToCssFile(sassPath);
  const expected = 'path/to/sass/file/sass.css';

  t.is(cssPath, expected);
});

test('`sassFileToCssFile()` replaces scss file extension with `css`', t => {
  const scssPath = 'path/to/sass/file/sass.scss';
  const cssPath = compiler.sassFileToCssFile(scssPath);
  const expected = 'path/to/sass/file/sass.css';

  t.is(cssPath, expected);
});

test('`sassFileToCssFile()` throws an error if passed file is not a scss or sass file', t => {
  const sassPath = 'path/to/sass/file/sass';

  t.throws(compiler.sassFileToCssFile.bind(null, sassPath));
});

test.serial('`compile()` compiles every sass/scss file that is not a partial sass file', async t => {
  await compiler.compile();

  await sleep(500);

  t.true((await promisify(fs.stat)('test/styles/scss/styles.css')).isFile());
  t.true((await promisify(fs.stat)('test/styles/scss/styles2.css')).isFile());

  await (async () => {
    try {
      await promisify(fs.stat)('test/styles/scss/_buttons.css');
    } catch (error) {
      if (error.code === 'ENOENT') {
        t.pass();
      } else {
        t.fail();
      }
    }
  })();
});

test.serial('`compiles() compiles only files that depends on the ones changes, and the changed files themself', async t => {
  const changedFiles = ['styles.scss'];

  await compiler.compile(changedFiles);

  await sleep(100);

  t.true((await promisify(fs.stat)('test/styles/scss/styles.css')).isFile());
  t.true((await promisify(fs.stat)('test/styles/sass/styles.css')).isFile());

  await (async () => {
    try {
      await promisify(fs.stat)('test/styles/scss/styles2.css');
    } catch (error) {
      if (error.code === 'ENOENT') {
        t.pass();
      } else {
        t.fail();
      }
    }
  })();
});

test.serial('`arraysHaveCommonItems()` returns true only if the passed arrays have common items', t => {
  const array1 = ['a', 'b', 'c'];
  const array2 = ['A'];
  const array3 = [''];
  const array4 = ['bc'];
  const array5 = ['b', 'hey'];

  t.true(compiler.arraysHaveCommonItems(array1, array2));
  t.false(compiler.arraysHaveCommonItems(array1, array3));
  t.false(compiler.arraysHaveCommonItems(array1, array4));
  t.true(compiler.arraysHaveCommonItems(array1, array5));
});

// Test.serial('if sourceMap flag is passed, create source maps', async t => {
//   const newCompiler = new StandaloneSass();
//   await newCompiler.init({
//     watch: false,
//     sourceMap: true,
//     dir: '.'
//   }, ['test/styles'], false);

//   await sleep(500);
//   await newCompiler.compile();
//   await sleep(500);

//   t.true((await promisify(fs.stat)('test/styles/scss/styles.css.map')).isFile());
//   t.true((await promisify(fs.stat)('test/styles/scss/styles2.css.map')).isFile());
// });

test.serial('a file passed as -f or --file will be compiled', async t => {
  const newCompiler = new StandaloneSass();
  newCompiler.init({
    file: 'test/styles/scss/styles.scss'
  });

  await newCompiler.compile();
  t.true((await promisify(fs.stat)('test/styles/scss/styles.css')).isFile());
});

test.serial('a directory passed as -d or --dir will be compiled', async t => {
  const newCompiler = new StandaloneSass();
  newCompiler.init({
    dir: 'test/styles/scss/'
  });

  await newCompiler.compile();
  t.true((await promisify(fs.stat)('test/styles/scss/styles.css')).isFile());
});

test.serial('do nothing if no sass/scss files were found', async t => {
  try {
    await promisify(fs.mkdir)('test/styles2');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(error);
    }
  }

  const newCompiler = new StandaloneSass();
  await newCompiler.init({
    watch: false,
    sourceMap: false,
    dir: '.'
  }, ['test/styles2'], false);

  await sleep(100);

  await newCompiler.compile();

  t.is(newCompiler.fileMap, null);

  promisify(rimraf)('test/styles2');
});

test.serial('supports an array of only directories', async t => {
  const newCompiler = new StandaloneSass();
  await newCompiler.init({
    watch: false,
    sourceMap: false,
    dir: '.'
  }, ['test/styles/sass/', 'test/styles/scss/'], false);

  await newCompiler.compile();

  await sleep(100);

  t.true((await promisify(fs.stat)('test/styles/scss/styles.css')).isFile());
  t.true((await promisify(fs.stat)('test/styles/sass/styles.css')).isFile());
});

test.serial('supports an array of only files', async t => {
  const newCompiler = new StandaloneSass();
  await newCompiler.init({
    watch: false,
    sourceMap: false,
    dir: '.'
  }, ['test/styles/sass/styles.sass', 'test/styles/scss/styles.scss'], false);

  await newCompiler.compile();

  await sleep(100);

  t.true((await promisify(fs.stat)('test/styles/scss/styles.css')).isFile());
  t.true((await promisify(fs.stat)('test/styles/sass/styles.css')).isFile());
});

test.serial('supports an array of both files and directories', async t => {
  const newCompiler = new StandaloneSass();
  await newCompiler.init({
    watch: false,
    sourceMap: false,
    dir: '.'
  }, ['test/styles/sass', 'test/styles/scss/styles.scss'], false);

  await newCompiler.compile();

  await sleep(100);

  t.true((await promisify(fs.stat)('test/styles/scss/styles.css')).isFile());
  t.true((await promisify(fs.stat)('test/styles/sass/styles.css')).isFile());
});

test('if no option param is passed, use defaults', t => {
  const newCompiler = new StandaloneSass();
  newCompiler.init(undefined, false);

  t.deepEqual(newCompiler.options, StandaloneSass.defaultOptions);
});

test('use dir from `options` if the passed `directoriesAndFiles` param is not an array', t => {
  const newCompiler = new StandaloneSass();
  const NOT_AN_ARRAY = 'NOT_AN_ARRAY';
  const dir = '.';

  newCompiler.init({
    dir
  }, NOT_AN_ARRAY);

  t.deepEqual(newCompiler.directoriesAndFiles, [dir]);
});

/**
 * Structure:
 *
 *  test
 *    | styles
 *      | scss
 *          _buttons.scss
 *          styles.scss
 *          styles2.scss
 *          styles3.scss
 *      | sass
 *          styles.sass
 *
 */
async function setupStylesDirectory() {
  try {
    await promisify(fs.mkdir)('test/styles');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(error);
    }
  }

  try {
    await promisify(fs.mkdir)('test/styles/scss');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(error);
    }
  }

  try {
    await promisify(fs.mkdir)('test/styles/sass');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(error);
    }
  }

  await promisify(fs.writeFile)('test/styles/scss/_buttons.scss', 'button{color:red;box-shadow:0 1px 5px rgba(0,0,0,.4)}');
  await promisify(fs.writeFile)('test/styles/scss/styles.scss', '@import \'buttons\';');
  await promisify(fs.writeFile)('test/styles/scss/styles2.scss', 'div{display:block}');
  await promisify(fs.writeFile)('test/styles/scss/styles3.scss', 'div; display block}');
  await promisify(fs.writeFile)('test/styles/sass/styles.sass', '@import \'../scss/styles.scss\'');
}

async function deleteStylesDirectory() {
  try {
    await promisify(rimraf)('test/styles');
  } catch (error) {
    console.error(error);
  }
}

function sleep(millis) {
  return new Promise(resolve => {
    setTimeout(resolve, millis);
  });
}
