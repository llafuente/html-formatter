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
    console.log("\n________________________\n");
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
      console.log('opentag', node.name);

      tags.push({
        node: node,
        contents: [],
        hasText: false,
        rawText: false,
        newlineClose: false,
        lastWasText: null
      });

      printOpenTag(output, indent, node.name);

      const attrs = getAttributes(node);
      const count = getAttributeCount(node);

      if (count == 1) {
        output[output.length - 1] += ' ' + attrs.map((attr) => {
          return attr.trim();
        }).join(' ');
      } else {
        console.log('inlined attrs', options.multiAttrsInline.length);

        // inlined attrs
        for (let i = 0; i < attrs.length; ++i) {
          for (let j = 0; j < options.multiAttrsInline.length; ++j) {
            console.log('--->',i, attrs[i], options.multiAttrsInline[j], attrs[i].match(options.multiAttrsInline[i]));
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

      console.log('closetag', tagName, t);

      if (tags.length) {
        tags[tags.length - 1].contents.push(t);
        tags[tags.length - 1].lastWasText = false;
      }

      if (t.hasText && !t.contents.length) {
        // collapse!
        if (t.rawText) {
          output[output.length - 2] += output[output.length - 1];
        } else {
          output[output.length - 2] += output[output.length - 1].trim();
        }
        output.pop();
      }

      printCloseTag(output, indent, tagName, t.newlineClose ? false : t.contents.length == 0);
    };

    parser.ontext = function (text) {
      console.log('text', JSON.stringify(text));

      let t = tags.length ? tags[tags.length - 1] : null;
      let isPre = t ? t.node.name === 'pre' : false;

      if (t.lastWasText) {
        // this maybe a parsing problem, sometimes it call ontext
        // many times
        text = output.pop() + text;
      }

      // do not use trim, because remove newlines
      let cleanText = text;

      if (!t.lastWasText) {
        cleanText = cleanText
          .replace(/^[\r\n][\r\n]*/, '') // remove newlines at start of texts
      }

      cleanText = cleanText
        .replace(/^[ \t][ \t]*/, '') // start
        .replace(/[ \t][ \t]*$/, '') // end
        .replace(/^(\r|\n)*$/, ''); // only new lines?

      console.log('cleanText', JSON.stringify(cleanText));
      //if (text.match(wsRE) == null) {
      if (cleanText.length) {
        if (!t) {
          throw new Error("Global text is not allowed, enclose it in a tag");
        }

        console.log('t.lastWasText', t.lastWasText);

        t.hasText = true;
        t.lastWasText = true;

        if (isPre) {
          t.rawText = true;
          output.push(text);
          return;
        }

        // no-pre -> use trimmed one
        text = cleanText;

        const multiline = text.indexOf("\n") !== -1;
        console.log('multiline', multiline);

        if (!multiline) {
          output.push(indent.join('') + text);
          return;
        }

        t.rawText = true;

        // reformat string if not in a pre
        output.push(
          "\n" + text.split("\n").map((line) => {
            return indent.join('') + line.trim();
          }).join("\n")
        );

        if (t) {
          t.newlineClose = true;
        }
      }
    };

    parser.oncomment = function (comment) {
      const multiline = (comment.match(/\\n/) || []).length;
      if (multiline) {
        output.push(`<!--\n${comment.trim()}\n-->`);
      } else {
        output.push(indent.join('') + `<!-- ${comment} -->`)
      }
    };

    parser.onend = function () {
      console.log('module.exports.options.newlineEOF', module.exports.options.newlineEOF);
      if (module.exports.options.newlineEOF) {
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
  const order = attrOrder["*"].concat(attrOrder[node.name] || []);
  const keys = Object.keys(node.attributes);
  const attrs = [];

  for (let i = 0; i < order.length; ++i) {
    const re = "object" === typeof order[i];

    //regex!
    for (let j = 0; j < keys.length; ++j) {
      if (re ? order[i].test(keys[j]) : order[i] == keys[j]) {
        attrs.push(getAttribute(keys[j], node.attributes[keys[j]]));

        //console.log('re / ', keys[j]);
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
