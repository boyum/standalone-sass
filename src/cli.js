#!/usr/bin/env node

'use strict';

const meow = require('meow');
const {
  compile
} = require('./app');

const cli = meow(`
  Usage
    $ standalone-sass <directory>

  Options
    --watch, -w       Watch files in input directory
    --source-map, -m  Use source maps
    --dir, -d         Directory (default \`.\`)

  Examples
    $ standalone-sass -wm --dir assets/styles/
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
      alias: 'd',
      default: '.'
    }
  }
});

compile(cli.input[0], cli.flags);
