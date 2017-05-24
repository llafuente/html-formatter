// dev-doc: https://github.com/isaacs/sax-js
const sax = require("sax");
const fs = require("fs");

module.exports = {
  options: {
    attributes: {
      order: {
        '*': [],
        // any tag
      },
      // attributes that will be in the same line, count as one
      inline: {},
      ignoreCount: [],
      forceEmpty: [],
    },
    newlineAfter: [],
    newlineEOF: false,
  },
  formatFile: function(filename, options, callback) {
    const str = fs.readFileSync(filename);

    return this.format(str, options, callback);
  },
  format: function(html, options, callback) {
    //console.log("\n________________________\n");
    // final text as an array to easy operate
    let output = [];
    const tags = []; // node structure
    let indent = []; // indentation

    options.indentation = options.indentation || '  ';
    options.multiAttrsInline = options.multiAttrsInline || [];

    const parser = sax.parser(true, {
      strictEntities : false
    });

    parser.onerror = function(err) {
      //console.error(err);
      parser.error = null
      parser.resume()
    };

    parser.onopentag = function (node) {
      //console.log('opentag', node.name);

      const newTag = {
        node: node,
        contents: [],
        text: '',
        isRawText: false,
        newlineBeforeClose: false,
      };

      if (tags.length) {
        const t = tags[tags.length - 1];
        t.contents.push(newTag);

        handleTagText(output, indent, t);
      }

      tags.push(newTag);

      printOpenTag(output, indent, node.name);

      const attrs = getAttributes(node);
      const count = getAttributeCount(node);

      if (count == 1) {
        output[output.length - 1] += ' ' + attrs.map((attr) => {
          return attr.trim();
        }).join(' ');
      } else {
        //console.log('inlined attrs', options.multiAttrsInline.length);

        // inlined attrs
        for (let i = 0; i < attrs.length; ++i) {
          for (let j = 0; j < options.multiAttrsInline.length; ++j) {
            //console.log('--->',i, attrs[i], options.multiAttrsInline[j], attrs[i].match(options.multiAttrsInline[i]));
            if (attrs[i].match(options.multiAttrsInline[j]) != null) {
              // inline, pop
              output[output.length - 1] += ' ' + attrs[i].trim();
              attrs.splice(i, 1);

              // this reset may not be necesary if multiAttrsInline are sorted...
              i = 0;
              j = options.multiAttrsInline.length;
            }
          }
        }
        // newlined attrs
        attrs.forEach((line) => {
          output.push(indent.join('') + options.indentation + line.trim());
        });
      }

      printOpenTagClose(output, indent, node.name);
      indent.push(options.indentation);
    };

    parser.onclosetag = function (tagName) {
      const t = tags.pop();

      //console.log('closetag', tagName, t);
      handleTagText(output, indent, t);
      //console.log('closetag', tagName, t);

      printCloseTag(output, indent, tagName, t.newlineBeforeClose ? false : t.contents.length == 0);

      if (module.exports.options.newlineAfter.indexOf(tagName) !== -1) {
        output.push('');
      }
    };

    parser.ontext = function (text) {
      //console.log('text', JSON.stringify(text));

      let t = tags.length ? tags[tags.length - 1] : null;

      if (t !== null) {
        t.text += text;
      }
    };

    parser.oncomment = function (comment) {
      const multiline = comment.indexOf('\n') !== -1;
      if (multiline) {
        indent.push(options.indentation);
        comment = formatText(indent, comment);
        indent.pop();

        output.push(
          indent.join('') +
          '<!--\n' +
          comment + '\n' +
          indent.join('') + '-->'
        );
      } else {
        output.push(indent.join('') + `<!-- ${comment.trim()} -->`)
      }

      let t = tags.length ? tags[tags.length - 1] : null;

      if (t !== null) {
        t.contents.push('comment');
      }
    };

    parser.onend = function () {
      //console.log('module.exports.options.newlineEOF', module.exports.options.newlineEOF, 'last text', JSON.stringify(output[output.length -1]));
      // add new line? last line has text ?
      if (module.exports.options.newlineEOF && output[output.length -1].length) {
        callback(null,  output.join('\n') + '\n');
      } else {
        callback(null,  output.join('\n'));
      }
    };

    parser.write(html).close();
  }
}

const wsRE = /^(\s|\n|\r)*$/;

function getAttributes(node) {
  const attrOrder = module.exports.options.attributes.order;
  const inline = module.exports.options.attributes.inline;
  const order = attrOrder["*"].concat(attrOrder[node.name] || []);
  const keys = Object.keys(node.attributes);
  const attrs = [];

  for (let i = 0; i < order.length; ++i) {
    const re = "object" === typeof order[i];

    //regex!
    for (let j = 0; j < keys.length; ++j) {
      if (re ? order[i].test(keys[j]) : order[i] == keys[j]) {
        let attrText = getAttribute(keys[j], node.attributes[keys[j]]);

        // inline more attributes ?
        if (inline[keys[j]]) {
          inline[keys[j]].forEach((attrName) => {
            const c = keys.indexOf(attrName);

            if (c !== -1) {
              attrText += ' ' + getAttribute(attrName, node.attributes[attrName]);
              keys.splice(c, 1);
            }
          });
        }

        attrs.push(attrText);

        ////console.log('re / ', keys[j]);
        keys.splice(j, 1);
        --j;
      }
    }
  }

  if (keys.length) {
    throw new Error("Add rule to sort attributes: " + keys);
  }

  return attrs;
}

function printOpenTag(output, indent, tagName) {
  output.push(indent.join('') + `<${tagName}`);
}

function printOpenTagClose(output, indent, tagName) {
  switch(tagName) {
    case 'img':
    case 'input':
      output[output.length - 1] += ' />';
      break;
    default:
      output[output.length - 1] += '>';
  }
}

function printCloseTag(output, indent, tagName, inline) {
  indent.pop();
  switch(tagName) {
  case 'img':
  case 'input':
    break;
  default:
    if (inline) {
      output[output.length - 1] += `</${tagName}>`;
    } else {
      output.push(indent.join('') + `</${tagName}>`);
    }
  }
}

function getAttribute(attr, value) {
  if (module.exports.options.attributes.forceEmpty.indexOf(attr) !== -1) {
    return `${attr}`;
  }

  return `${attr}="${value}"`;
}

function getAttributeCount(node) {
  return Object
    .keys(node.attributes)
    .filter(function(key) {
      return module.exports.options.attributes.ignoreCount.indexOf(key) === -1;
    }).length;
}


function formatTextNode(indent, t) {
  let text = t.text;
  let isPre = t ? t.node.name === 'pre' : false;

  if (isPre) {
    t.isRawText = true;
    return text;
  }

  // do not use trim, because remove newlines
  let cleanText = text;

  cleanText = cleanText.trim();

  //  .replace(/^[\r\n][\r\n]*/, '') // remove newlines at start of texts
  //  .replace(/^[ \t][ \t]*/, '') // start
  //  .replace(/[ \t][ \t]*$/, '') // end
  //  .replace(/^(\r|\n)*$/, ''); // only new lines?

  //console.log('cleanText', JSON.stringify(cleanText));
  //if (text.match(wsRE) == null) {
  if (!cleanText.length) {
    return null;
  }

  if (!t) {
    throw new Error("Global text is not allowed, enclose it in a tag");
  }

  // no-pre -> use trimmed one
  text = cleanText;

  const multiline = text.indexOf("\n") !== -1;
  //console.log('multiline', multiline);

  if (!multiline) {
    return indent.join('') + text;
  }

  if (t) {
    t.isRawText = true;
    t.newlineBeforeClose = true;
  }

  // reformat string if not in a pre
  return "\n" + text.split("\n").map((line) => {
      return indent.join('') + line.trim();
    }).join("\n");
}

function formatText(indent, text) {
  text = text.trim();
  const multiline = text.indexOf("\n") !== -1;

  if (!multiline) {
    return indent.join('') + text;
  }

  return text.split("\n").map((line) => {
      return indent.join('') + line.trim();
    }).join("\n");
}

function handleTagText(output, indent, t) {
  if (t.text.length) {
    t.text = formatTextNode(indent, t);
    //console.log("final text: ", JSON.stringify(t.text));
    if (t.text !== null && t.text.length) {
      // inline text ?
      if (t.contents.length) {
        output.push(t.text);
      } else if (t.isRawText) {
        output[output.length -1] += t.text;
      } else {
        output[output.length -1] += t.text.trim();
      }
    }
  }

  t.text = '';
}
