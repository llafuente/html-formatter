// test/hello-world.js
var tap = require('tap')
var formatter = require('../')
var path = require('path')


formatter.options.attributes.ignoreCount = ['th2-auth-parent'];

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

formatter.options.attributes.forceEmpty.push('th2-auth-parent');
formatter.options.attributes.forceEmpty.push('th2-auth-child');

formatter.options.newlineAfter = [
  "container"
];

tap.test('text inside tag', function (t) {
  formatter.format('<div>XXXX</div>', {}, function(err, text) {
    t.equal(text, '<div>XXXX</div>');
    t.end();
  });
});


tap.test('text and tag inside container', function (t) {
  formatter.format(`<div>XXXX<div>YYYY</div></div>`, {}, function(err, text) {
    t.equal(text, `<div>
  XXXX
  <div>YYYY</div>
</div>`);
    t.end();
  });
})
;
tap.test('tags inside container', function (t) {
  formatter.format(`<div>
  <div>
  XXXX</div>

  <div>YYY</div>
</div>`, {
}, function(err, text) {
    t.equal(text, `<div>
  <div>XXXX</div>
  <div>YYY</div>
</div>`);
    t.end();
  });
});

tap.test('tabulate text inside not-pre', function (t) {
  formatter.format(`<div>
  <div>
     X
X
X
X</div>
</div>`, {}, function(err, text) {
    t.equal(text, `<div>
  <div>
    X
    X
    X
    X
  </div>
</div>`);
    t.end();
  });
});

tap.test('tabulate text inside not-pre', function (t) {
  formatter.format(`<div>
  <div>
     X
X
X
X
</div>
</div>`, {}, function(err, text) {
    t.equal(text, `<div>
  <div>
    X
    X
    X
    X
  </div>
</div>`);
    t.end();
  });
});

tap.test('no tabulate pre text', function (t) {
  formatter.format(`<pre>
X
 X
X
</pre>`, {}, function(err, text) {
    //console.log(JSON.stringify(text));
    t.equal(text, `<pre>
X
 X
X
</pre>`);
    t.end();
  });
});


tap.test('inline one attribute', function (t) {
  formatter.format(`<div
    class="disabled">wtf!</div>`, {}, function(err, text) {
    t.equal(text, `<div class="disabled">wtf!</div>`);
    t.end();
  });
});

tap.test('input self-closing', function (t) {
  formatter.format(`<input
    class="disabled" />`, {}, function(err, text) {
    t.equal(text, `<input class="disabled" />`);
    t.end();
  });
});

tap.test('newline-tab attributes', function (t) {
  formatter.format(`<input class="disabled" disabled="xxxx" />`, {}, function(err, text) {
    t.equal(text, `<input
  class="disabled"
  disabled="xxxx" />`);
    t.end();
  });
});

tap.test('newline-tab attributes sorted', function (t) {
  formatter.format(`<input disabled="xxxx" class="disabled" />`, {}, function(err, text) {
    t.equal(text, `<input
  class="disabled"
  disabled="xxxx" />`);
    t.end();
  });
});

tap.test('newline-tab attributes sorted regex', function (t) {
  formatter.format(`<input disabled="xxxx" class="disabled" [class.disabled]="true" />`, {}, function(err, text) {
    t.equal(text, `<input
  class="disabled"
  [class.disabled]="true"
  disabled="xxxx" />`);
    t.end();
  });
});

tap.test('test ignoreCount', function (t) {
  formatter.format(`<div
    class="xxx"
    th2-auth-parent>
    </div>`, {}, function(err, text) {
    t.equal(text, `<div class="xxx" th2-auth-parent></div>`);
    t.end();
  });
});

tap.test('test ignoreCount but keep them sorted', function (t) {
  formatter.format(`<div
    th2-auth-parent class="xxx"
    >
    </div>`, {}, function(err, text) {
    t.equal(text, `<div class="xxx" th2-auth-parent></div>`);
    t.end();
  });
});

tap.test('test texnode append', function (t) {
  formatter.format("<p>4\n5</p>", {}, function(err, text) {
    t.equal(text, "<p>\n  4\n  5\n</p>");
    t.end();
  });
});

tap.test('test nested texnode append', function (t) {
  formatter.format("<a><p>4\n5</p></a>", {}, function(err, text) {
    t.equal(text, "<a>\n  <p>\n    4\n    5\n  </p>\n</a>");
    t.end();
  });
});

tap.test('nested texnode append', function (t) {
  formatter.format("<b></b><a><p>4\n5</p></a>", {}, function(err, text) {
    t.equal(text, "<b></b>\n<a>\n  <p>\n    4\n    5\n  </p>\n</a>");
    t.end();
  });
});

tap.test('newline-tab attributes sorted regex', function (t) {
  formatter.format(`      <thead>
        <tr>
          <th>Fecha</th>
          <th>Usuario</th>
          <th>Tipo</th>
          <th class="actions" rows="3">Acciones</th>
        </tr>
      </thead>`, {}, function(err, text) {
    t.equal(text, `<thead>
  <tr>
    <th>Fecha</th>
    <th>Usuario</th>
    <th>Tipo</th>
    <th
      class="actions"
      rows="3">Acciones</th>
  </tr>
</thead>`);
    t.end();
  });
});


tap.test('newline-tab attributes sorted regex', function (t) {
  formatter.format(`        <tr *ngFor="let audit of changes" th2-auth-parent>
          <td>{{audit.date | date:'dd/MM/yyyy HH:mm'}}</td>
          <td>{{audit.userCompleteName}}</td>
          <td>{{audit.type}}</td>
          <td class="actions">
          <a class="btn btn-primary btn-icon"
            *ngIf="audit.type == 'CONFIGURATION_CHANGE'"
            [class.disabled]="deployment.currentRevision == audit.confRevisionId"
            th2-auth-child resource="MANAGE_PRODUCT"
            (click)="rollback(audit)">Rollback</a>
          </td>
        </tr>`, {
        }, function(err, text) {
    t.equal(text, `<tr *ngFor="let audit of changes" th2-auth-parent>
  <td>{{audit.date | date:'dd/MM/yyyy HH:mm'}}</td>
  <td>{{audit.userCompleteName}}</td>
  <td>{{audit.type}}</td>
  <td class="actions">
    <a
      class="btn btn-primary btn-icon"
      [class.disabled]="deployment.currentRevision == audit.confRevisionId"
      *ngIf="audit.type == 'CONFIGURATION_CHANGE'"
      th2-auth-child
      resource="MANAGE_PRODUCT"
      (click)="rollback(audit)">Rollback</a>
  </td>
</tr>`);
    t.end();
  });
});


tap.test('format text node properly', function (t) {
  formatter.format(`<div>XXXXX<b>BBBBBB</b>YYYYY<i>sdsfdsfds</i></div>`, {
        }, function(err, text) {
    t.equal(text, `<div>
  XXXXX
  <b>BBBBBB</b>
  YYYYY
  <i>sdsfdsfds</i>
</div>`);
    t.end();
  });
});

tap.test('test newlineEOF', function (t) {
  formatter.options.newlineEOF = true;

  formatter.format(
    `<container><p>xxxx</p><p>fdhsjdfhsjd</p></container>`,
    {},
    function(err, text) {
      formatter.options.newlineEOF = false;
      t.equal(text, `<container>
  <p>xxxx</p>
  <p>fdhsjdfhsjd</p>
</container>
`);
    t.end();
  });
});

tap.test('test newlineAfter', function (t) {

  formatter.format(
    `<container><p>1</p><p>2</p></container><container><p>3</p><p>4
5</p></container><div></div>`,
    {},
    function(err, text) {
      formatter.options.newlineEOF = false;
      t.equal(text, `<container>
  <p>1</p>
  <p>2</p>
</container>

<container>
  <p>3</p>
  <p>
    4
    5
  </p>
</container>

<div></div>`);
    t.end();
  });
});


tap.test('align comments', function (t) {

  formatter.format(
    `<!-- WTF! -->
    <div><!-- WTF! --><!-- WTF!2 --></div>`,
    {},
    function(err, text) {
      formatter.options.newlineEOF = false;
      t.equal(text, `<!-- WTF! -->
<div>
  <!-- WTF! -->
  <!-- WTF!2 -->
</div>`);
    t.end();
  });
});

tap.test('align comments', function (t) {

  formatter.format(
    `<div><!--a\n\nb\n\nc\n--></div>`,
    {},
    function(err, text) {
      formatter.options.newlineEOF = false;
      t.equal(text, ``);
    t.end();
  });
});


tap.test('format text node properly', function (t) {
  formatter.options.newlineEOF = true;
  const filename = path.join(__dirname, '../../front/dashboard/thin2-fe/src/app/views/Environment/EnvReleases/ReleaseService/ReleaseService.component.html');
  formatter.formatFile(
    filename, {
  }, function(err, text) {
    //t.equal(text, ``);
    require('fs').writeFileSync(filename, text);
    t.end();
  });
});



/**/
