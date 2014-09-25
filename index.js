var handlebars = require('handlebars');
var fs = require('fs');
var se = require('./lib/stackexchange');
var gs = require('./lib/stackexchange/go-struct');

var crawler = se.Crawler;
var types = se.Types;
var basePath = './out';

var resolveOutPath = function (type) {
  return basePath + '/' + type + '.go';
};

var convertType = function (field) {
  var type = field.type;
  var types = se.Types;

  switch (type) {
    case 'integer':
    case 'enum':
    case 'decimal':
    case 'date':
      return 'int64';
    case 'boolean':
        return 'bool';
    case 'string':
    case 'strings':
    case 'enum':
        return 'string';
    case 'array':
        return '[]' + convertType({ type: field.values });
    default:
      var result = types.some(function (t) {
        return t === type;
      });

      if (result) {
        return '*' + capitalCamel(type);
      }
      return 'interface{}';
  }
};

var capitalCamel = function (str) {
  var rest = str.slice(1);
  return str.charAt(0).toUpperCase() + rest.replace(/(\_[a-z])/g, function($1){return $1.toUpperCase().replace('_','');});
};

var constructType = function (name, desc) {
  var fields = [];
  Object.keys(desc).forEach(function (key) {
    var field = desc[key];
    fields.push({
      name: capitalCamel(key),
      type: convertType(field),
      tag: '`json:"' + key + '"`'
    });
  });

  return fields;
};

var source = fs.readFileSync('./templates/struct.hbr', 'utf8');
var template = handlebars.compile(source);

types.forEach(function (type) {
  crawler.getTypeObject(type, function (err, obj) {
    var p = resolveOutPath(type);
    var t = constructType(type, obj[type]);

    var model = {
      package: 'models',
      type: capitalCamel(type),
      fields: t
    };
    gs.saveToFile(type, template(model), function (err) {
        console.log(err);
        gs.formatCodes(function (err) {
          console.log(err);
        });
    });
  });
});
