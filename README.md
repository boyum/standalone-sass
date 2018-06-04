# standalone-sass

[![Build Status](https://travis-ci.org/boyum/standalone-sass.svg?branch=master)](https://travis-ci.org/boyum/standalone-sass)
[![Coverage Status](https://coveralls.io/repos/github/boyum/standalone-sass/badge.svg?branch=master)](https://coveralls.io/github/boyum/standalone-sass?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/boyum/standalone-sass.svg)](https://greenkeeper.io/)

Compile sass/scss on Windows systems, even those without node installed! `standalone-sass` is a compiler built with [`node-sass`](https://github.com/sass/node-sass) and [`zeit/pkg`](http://github.com/zeit/pkg).

## Usage

```
  Usage
    $ standalone-sass <space seperated list of directories and files>

  Options
    --watch, -w       Watch input files/directories
    --source-map, -m  Render source maps
    --dir, -d         Specify directory
    --file, -f        Specify file

  Examples
    Compile every sass/scss file in the directory assets/styles/, and the file other-assets/styles/styles.scss once:
    $ standalone-sass assets/styles other-assets/styles/styles.scss
    
    Compile every sass/scss file in assets/styles/ with source maps, and start watch mode:
    $ standalone-sass -wm --dir assets/styles/
    
    Compile assets/styles/styles.scss once:
    $ standalone-sass -f assets/styles/styles.scss
```

`standalone-sass` will check for sass/scss files in every directory that is a descendant of the directories provided, including itself. In watch mode, the changed files and files that depend on them will be built. `standalone-sass` does not build partial sass files (files which file name start with an underscore (`_`)). Keep in mind that changes outside of the scope will not trigger recompile in watch mode. This means that if you list a number of files, only those will trigger recompile.

In order for the executable to work, a `binding.node` file (found in `node_modules/node-sass/vendor`) must be provided in the same directory as the executable itself. Which `binding.node` file to use depends on the environment the executable was built in.

## Development

Be sure to have node and npm installed on your computer before building this project. Run the following command from the project root to setup your environment.

```
$ npm install
```

To build a Windows executable, run `npm run build`.

Pull requests are welcome.

## License

Apache 2.0, Sindre Bøyum (2018)
