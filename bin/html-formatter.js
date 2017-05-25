#!/usr/bin/env node
'use strict';

// node .\bin\html-formatter.js ..\robo-advisor\front\thin2-fe\src\app\**\*.html
// node .\bin\html-formatter.js ../robo-advisor/front/thin2-fe/src/app/views/Test/Test.component.html

const argv = require('yargs')
  .usage('Usage: $0 --config [config-file] files\n' +
  '  files are globbed')
  .default('config', '.html-formatter.json')
  .demandCommand(1)
  .help()
  .argv;

// get config

const fs = require('fs');
const path = require('path');

let cwd = __dirname;
let lcwd;
let config;

while (lcwd != cwd) {
  console.log('cwd', cwd);

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

console.log(`Glob matched ${files.length} files`);


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

console.log("options", config.attributes);


formatter.options = config;

files.forEach((filename) => {
  console.log("formatting", filename);

  formatter.formatFile(
    filename, {
  }, function(err, text) {
    console.log("saving", filename);
    require('fs').writeFileSync(filename, text);
  });
});
