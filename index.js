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
      forceEmpty: []
    }
  },
  formatFile: function(filename, options, callback) {
    const str = fs.readFileSync(filename);

    return this.parse(str, options, callback);
  },
  format: function(html, options, callback) {
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
        newlineClose: false,
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
      console.log('closetag', tagName);

      const t = tags.pop();

      if (tags.length) {
        tags[tags.length - 1].contents.push(t);
      }

      printCloseTag(output, indent, tagName, t.newlineClose ? false : t.contents.length == 0);
    };

    parser.ontext = function (text) {
      console.log('text', text);

      let isPre = false;
      if (tags.length) {
        isPre = tags[tags.length - 1].node.name === 'pre';
      }

      const rtext = text.trim();
      //if (text.match(wsRE) == null) {
      if (rtext.length) {
        if (!isPre) {
          text = rtext;
        }

        if (tags.length) {
          tags[tags.length - 1].hasText = true;
        }

        const multiline = text.split("\n").length > 1;

        if (multiline) {
          // reformat string if not in a pre
          if (!isPre) {
            output.push(
              text.split("\n").map((line) => {
                return indent.join('') + line.trim();
              }).join("\n")
            );

            if (tags.length) {
              tags[tags.length - 1].newlineClose = true;
            }

          } else {
            output[output.length -1] += text;
          }
        } else {
          output[output.length -1] += text;
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
      console.log(output.join('\n'));

      callback(null, output.join('\n'));
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
