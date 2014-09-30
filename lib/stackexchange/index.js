var fs = require('fs');
var Types = module.exports.Types = require('./types');
var Crawler = module.exports.Crawler = require('./crawler');
var Converter = module.exports.Converter = require('./go-converter')

module.exports.run = function (callback) {
  // Prepare destination
  if (!fs.existsSync('./out')) {
    fs.mkdirSync('./out');
  }

  if (!fs.existsSync('./out/stackexchange')) {
    fs.mkdirSync('./out/stackexchange');
  }

  if (!fs.existsSync('./out/stackexchange/dest')) {
    fs.mkdirSync('./out/stackexchange/dest');
  }

  var length = Types.length;
  Types.forEach(function (type) {
    Crawler.getTypeObject(type, function (err, obj) {
      if (err) {
        console.log('type: ' + type + 'failed to crawl');
        if (!--length) {
          callback(err);
        }
      }
      Converter.convert(type, obj, function (err, model) {
        if (!--length) {
          callback(err);
        }
        
        Converter.saveToFile(type, model, function (err) {
          if (!--length) {
            callback(err);
          }
        });
      });
    });
  });
};
