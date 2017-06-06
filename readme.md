# html-formatter


Format/Beautify HTML the right way, giving you full control!

Designed specially for heavy attribute HTML like Angular.

Features

* Choose indentation (tabs, spaces or any stupid character)
* Indent and proper vertical alignament of comments and text nodes
* Sort, inline and vertical alignament of attributes
* After formatting your code, your diff will be very readble.


## CLI


> html-formatter --config ./.html-formmatter.json ./**/*.hmtl

--config is optional and will use the closest parent file named:
`.html-formmatter.json`

### .html-formatter.json

This file contains the configuration used by the cli.

Here I leave my Angular 2 config as an example:

```json
{
  "attributes": {
    "order": {
      "*": [
        "*ngIf",
        "*ngFor",

        "id",
        "class",
        "/\\[class.*/",
        "style",
        "/\\[style.*/",

        "type",
        "name",
        "[name]",
        "value",
        "[value]",

        "size",
        "label",
        "placeholder",
        "[placeholder]",
        "[(ngModel)]",
        "checked",
        "[checked]",
        "required",
        "[required]",
        "disabled",
        "[disabled]",

        "href",
        "[routerLink]",
        "routerLinkActive",

        "src",
        "target",

        "alt",
        "title",

        "role",
        "for",
        "[for]",

        "/^\\(.*\\)$/",
        "/aria.*/",
        "/data.*/",
        "/\\#.*/"
      ]
    },
    "inline": {
      "id": ["class"],
      "alt": ["title"]
    },
    "ignoreCount": [],
    "forceEmpty": []
  },
  "newlineAfter": [],
  "newlineEOF": true
}
```


## API


```js

var formatter = require('../');
// set: formatter.options

const filename = path.join(__dirname, 'my-html-file.html');

formatter.formatFile(
  filename, {
}, function(err, text) {
  require('fs').writeFileSync(filename, text);
  t.end();
});

```


#### options.attributes.order[]


Object that contains how to sort attributes.
The keys are the `tagName` of the HTML tag.
The values are arrays of string/regex to match against attributes.

The key `*` will be applied to every tag.

Example:

```js
var formatter = require('../');
formatter.options.attributes.order['*'] = [
  "class",
  /^\[class.*/,
  "style",
  /^\[style.*/,
  "*ngIf",
  "*ngFor",
  /^\(*/,
];

formatter.options.attributes.order['input'] = [
  "type",
  "name",
  "placeholder"
];
```


#### formatter.options.attributes.forceEmpty


Some attributes could be empty in HTML, not in XHTML.
We use a strict parser and if you want to remove that conversion it's ok...

```js
formatter.options.attributes.forceEmpty = ['xxx'];
```


#### options.attributes.inline


Object wich key are the attribute that will appear first in the line.

*NOTE*: This may need to be used in conjuction with ignoreCount to
fully inline a tag.

Example:

```js
formatter.options.attributes.inline = { "auth": ["resource"] };
formatter.options.attributes.ignoreCount = ["resource"];
```

Input:
```html
<div
  auth="user"
  resource="add-user"
  disable="form.invalid">xxx</div>
```


```html
<div
  auth="user" resource="add-user"
  disable="form.invalid">xxx</div>
```


#### options.attributes.ignoreCount


List of attributes names that won't count as an attributes.
This allow to inline two or more attributes.

Input:
```html
<div class="row" style="width: 100px"></div>
```

Without ignoreCount
```html
<div
    class="row"
    style="width: 100px">
    </div>

```

With ignoreCount (class or style)

```html
<div class="row" style="width: 100px"></div>

```


#### formatter.options.newlineAfter


List of tag names. When closing the tag it will add a new line.

```js
formatter.options.newlineAfter = ['container', 'hr'];
```


#### formatter.options.newlineEOF


Add a new line at the end of the file.

```js
formatter.options.newlineEOF = true;
```


# Developer notes


To parse HTML I used [isaacs/sax-js](https://github.com/isaacs/sax-js)
(1.2.2) but I have to include it in the project directly because Angular
templates aren't XML compilant.


# License


MIT
