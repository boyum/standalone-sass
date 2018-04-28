const test = require('ava');
const {sassFileToCssFile} = require('../src/app');

test('`sassFileToCssFile()` replaces sass file extension with `css`', t => {
  const sassPath = 'path/to/sass/file/sass.sass';
  const cssPath = sassFileToCssFile(sassPath);
  const expected = 'path/to/sass/file/sass.css';

  t.is(cssPath, expected);
});

test('`sassFileToCssFile()` replaces scss file extension with `css`', t => {
  const scssPath = 'path/to/sass/file/sass.scss';
  const cssPath = sassFileToCssFile(scssPath);
  const expected = 'path/to/sass/file/sass.css';

  t.is(cssPath, expected);
});

test('`sassFileToCssFile()` throws an error if passed file is not a scss or sass file', t => {
  const sassPath = 'path/to/sass/file/sass';

  t.throws(sassFileToCssFile.bind(null, sassPath));
});