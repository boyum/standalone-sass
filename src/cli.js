#!/usr/bin/env node

'use strict';

const meow = require('meow');
const StandaloneSass = require('./app');

const cli = meow(`
  Usage
    $ standalone-sass <list of directories or files>

  Options
    --watch, -w       Watch files in input directory
    --source-map, -m  Use source maps
    --dir, -d         Directory
    --file, -f        Specify file

  Examples
    Compile every sass/scss file in the directory assets/styles/, and the file other-assets/styles/styles.scss once:
    $ standalone-sass assets/styles other-assets/styles/styles.scss
    
    Compile every sass/scss file in assets/styles/ with source maps, and start watch mode:
    $ standalone-sass -wm --dir assets/styles/
    
    Compile assets/styles/styles.scss once:
    $ standalone-sass -f assets/styles/styles.scss
`, {
  flags: {
    watch: {
      type: 'boolean',
      alias: 'w'
    },
    sourceMap: {
      type: 'boolean',
      alias: 'm'
    },
    dir: {
      type: 'string',
      alias: 'd'
    },
    file: {
      type: 'string',
      alias: 'f'
    }
  }
});

const compiler = new StandaloneSass();
compiler.init(cli.flags, cli.input);
