var handlebars = require('handlebars');
var fs = require('fs');
var exec = require('child_process').exec;
var utils = require('../utils');

// caching template
var source = fs.readFileSync('./templates/struct.hbr', 'utf8');
var template = handlebars.compile(source);
var basePath = './out/go/';

module.exports.getCodeString = function (model, callback) {
  // normalize model attributes

  try {
    var str = template(model);
    callback(null, str);
  } catch(e) {
    return callback(e);
  }

};

module.exports.saveToFile = function (type, data, callback) {
  var file = utils.capitalize(utils.toCamelCase(type));
  var finalPath = basePath + type + '.go';

  fs.writeFile(finalPath, data, function (err) {

  });
};

module.exports.formatCodes = function (callback) {
  exec('go fmt .', {
    cwd: basePath
  }, function (err, stdout, stderr) {

    if (err) {
      return callback(err);
    }

    stdout.pipe(process.stdout);
    stderr.pipe(process.stderr);
    callback(null);
  });
};
