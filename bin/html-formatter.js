#!/usr/bin/env node
'use strict';

// node .\bin\html-formatter.js ..\robo-advisor\front\thin2-fe\src\app\**\*.html
// node .\bin\html-formatter.js ../robo-advisor/front/thin2-fe/src/app/views/Test/Test.component.html

const argv = require('yargs')
  .usage('Usage: $0 [Options] files\n' +
  '  files are globbed')

  .describe('config', 'configuration file')
  .default('config', '.html-formatter.json')

  .describe('check', 'Check if given files are already formatted')
  .default('check', true)
  .boolean('check')

  .describe('write', 'Format files in-place')
  .default('write', false)
  .boolean('write')

  .describe('verbose', 'Format files in-place')
  .default('verbose', false)
  .boolean('verbose')


  .demandCommand(1)
  .help()
  .argv;

// get config

function verbose() {
  if (argv.verbose) {
    console.log.apply(console, arguments);
  }
}

const fs = require('fs');
const path = require('path');

let cwd = __dirname;
let lcwd;
let config;

while (lcwd != cwd) {
  verbose('cwd', cwd);

  const configFile = path.join(cwd, argv.config);

  if (fs.existsSync(configFile)) {
    config = require(configFile);
    break;
  }

  lcwd = cwd;
  cwd = path.join(cwd, '..');
}

//fs.statSync();

const glob = require('glob');

let files = [];

argv._.forEach((pattern) => {
  files = files.concat(glob.sync(pattern));
});

verbose(`Glob matched ${files.length} files`);


const formatter = require('../index.js');
// convert string -> regex
const order = config.attributes.order;
for (let i in order) {
  order[i] = order[i].map((str) => {
    if (str[0] == '/') {
      const parts = str.split('/');
      return new RegExp(parts[1], parts[2]);
    }

    return str;
  });
}

verbose("options", config.attributes);


formatter.options = config;

let allFileOk = true;

files.forEach((filename) => {
  verbose("reading file: ", filename);

  const fileStr = fs.readFileSync(filename).toString();

  formatter.format(
    fileStr,
    {},
    function(err, formmattedFile) {
      if (argv.write) {
        console.log(filename, "\u001B[32m[saved]\u001B[39m");
        require('fs').writeFileSync(filename, formmattedFile);
      } else if (argv.check) {
        if (formmattedFile === fileStr) {
          console.log(filename, "\u001B[32m[ok]\u001B[39m");
        } else {
          allFileOk = false;
          console.log(filename, "\u001B[31m[ko]\u001B[39m");
        }
      }
    }
  );

});

process.exit(allFileOk ? 0 : 1);
