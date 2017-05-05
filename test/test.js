// test/hello-world.js
var tap = require('tap')
var formatter = require('../')


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

tap.test('text inside tag', function (t) {
  formatter.format('<div>XXXX</div>', {}, function(err, text) {
    t.equal(text, '<div>XXXX</div>');
    t.end();
  });
});

tap.test('text and tag inside container', function (t) {
  formatter.format(`<div>
  XXXX
  <div>XXXX</div>
</div>`, {}, function(err, text) {
    t.equal(text, `<div>XXXX
  <div>XXXX</div>
</div>`);
    t.end();
  });
});

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
/*

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
  <a class="btn btn-primary btn-icon"
    *ngIf="audit.type == 'CONFIGURATION_CHANGE'"
    [class.disabled]="deployment.currentRevision == audit.confRevisionId"
    th2-auth-child resource="MANAGE_PRODUCT"
    (click)="rollback(audit)">Rollback</a>
  </td>
</tr>`);
    t.end();
  });
});

*/

