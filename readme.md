# html-formatter

Format HTML the right way, giving you full control!

Features

* Choose indentation (tabs, spaces or any stupid character)
* Indent / Align comments, text nodes
* Vertical Align, inline, sort attributes




#### options.attributes.order[]

Object that contains how to sort attributes.
The key is the tagName of the HTML tag, the value is an array of string/regex.

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

#### formatter.options.newlineAfter

List of tag names. When closing the tag it will add a new line.

#### formatter.options.newlineEOF

Add a new line at the end of the file.

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
