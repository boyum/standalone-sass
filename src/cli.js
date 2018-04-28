#!/usr/bin/env node

'use strict';

const meow = require('meow');
const StandaloneSass = require('./app');

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

const compiler = new StandaloneSass(cli.flags, cli.input[0]);
