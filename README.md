# standalone-sass [![Build Status](https://travis-ci.org/boyum/standalone-sass.svg?branch=master)](https://travis-ci.org/boyum/standalone-sass)

Standalone sass compiler built with [`node-sass`](https://github.com/sass/node-sass) and [`zeit/pkg`](http://github.com/zeit/pkg).

## Usage

```
  Usage
    $ standalone-sass <list of directories or files>

  Options
    --watch, -w       Watch files in input directory
    --source-map, -m  Use source maps
    --dir, -d         Directory (default \`.\`)
    --file, -f        Specify file

  Examples
    $ standalone-sass assets/styles other-assets/styles/styles.scss
    $ standalone-sass -wm --dir assets/styles/
    $ standalone-sass -f assets/styles/styles.scss
```

`standalone-sass` will check for sass/scss files in every directory that is a descendant of the directories provided, included itself. In watch mode, the changed files and files that depend on them will be built. `standalone-sass` does not build partial sass files (files which file name start with an underscore (`_`)). Keep in mind that changes outside of the scope will not trigger recompile in watch mode. This means that if you list a number of files, only those will trigger recompile.

In order for the executable to work, a `bindings.node` file must be provided in the same directory as the executable itself. Which `bindings.node` file to use depends on the environment the executable was built in.

## Development

Be sure to have node and npm installed on your computer before building this project. Run the following command from the project root to setup your environment.

```
$ npm install
```

To build a Windows executable, run `npm run build`.

## License

Apache 2.0, Sindre Bøyum (2018)
