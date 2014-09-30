var handlebars = require('handlebars');
var fs = require('fs');
var utils = require('../utils.js');
var Types = require('./types');
var basePath = './out/stackexchange/dest';

var resolveOutPath = function (type) {
  return basePath + '/' + type + '.go';
};

var convertType = function (field, types) {
  var type = field.type;
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
        return '[]' + convertType({ type: field.values }, types);
    default:
      var result = types.some(function (t) {
        return t === type;
      });

      if (result) {
        return '*' + utils.toCapitalCamel(type);
      }
      return 'interface{}';
  }
};

var constructType = function (name, desc) {
  var fields = [];
  Object.keys(desc).forEach(function (key) {
    var field = desc[key];
    fields.push({
      name: utils.toCapitalCamel(key),
      type: convertType(field, Types),
      tag: '`json:"' + key + '"`'
    });
  });

  return fields;
};

var source = fs.readFileSync('./templates/struct.hbr', 'utf8');
var template = handlebars.compile(source);

module.exports.convert = function (type, obj, callback) {
  var t = constructType(type, obj[type]);
  var model = {
    package: 'models',
    type: utils.toCapitalCamel(type),
    fields: t
  };
  callback(null, model);
};

module.exports.saveToFile = function (type, model, callback) {
   var file = utils.toCapitalCamel(type);
   var finalPath = resolveOutPath(file);

   fs.writeFile(finalPath, template(model), function (err) {
     callback(null);
   });
};

module.exports.formatCodes = function (callback) {
  exec('go fmt .', {
    cwd: basePath
  }, function (err, stdout, stderr) {
    if (err) {
      callback(err);
      return;
    }
    callback(null);
  });
};
