var fs = require('fs');
var async = require('async');
var cheerio = require('cheerio');
var http = require('http');
var types = require('./types');
var baseUrl = 'http://api.stackexchange.com/docs/';

var parseMetaData = function (desc, html) {
  if (html.indexOf('unchanged in unsafe filters') > -1) {
    desc.unchanged = true;
    html = html.replace('unchanged in unsafe filters', '');
  }

  if (html.indexOf('may be absent') > -1) {
    desc.absent = true;
    html = html.replace('may be absent', '');
  }

  if (html.indexOf(', refers to') > -1) {
    var refer = html.slice(html.indexOf(', refers to'));
    html = html.slice(0, html.indexOf(', refers to'));
    desc.refers = refer.slice(', refers to'.length).trim().split(' ')[1].trim();
  }

  if (html.indexOf('private_info') > -1) {
    desc.private = true;
    html = html.replace('private_info', '');
  }

  return html;
};

var parseDescription = module.exports.parseDescription = function (html) {
  var desc = {};
  html = parseMetaData(desc, html);

  if (html.indexOf('one of') > -1) {
    // enum
    desc.type = 'enum';
    desc.values = [];
    var slice = html.slice(html.indexOf('one of') + 'one of'.length);
    var values = slice.split(',');
    var length = values.length;

    values.forEach(function (value, index) {
      if (index === length -1) {
          // removing or
          value = value.slice(3);
      }
      desc.values.push(value.trim());
    });
    return desc;
  }

  if (html.indexOf('the id of the object') > -1) {
    desc.type = 'integer';
    return desc;
  }

  if (html.indexOf('an array of') > -1 ) {
    desc.type = 'array';
    var arrayType = html.slice(html.indexOf('an array of') + 'an array of'.length);

    if (arrayType.indexOf('strings') > -1) {
      desc.values = 'string';
    } else {
      var result = types.some(function (type) {
        if (arrayType.trim().search(type) === 0) {
          // must be plural
          desc.values = type;
          return true;
        }
        return false;
      });

      if (!result) {
        desc.values = arrayType.trim();
      }
    }
  } else {
    desc.type = html.trim();
  }

  return desc;
};

module.exports.resolvePath = function (type) {
  type = type.toLowerCase();
  type = type.replace('_', '-');
  if (type === 'wrapper') {
    return './docs/' + type + '.html';
  } else {
    return './docs/types/' + type + '.html';
  }
};

module.exports.resolveUrl = function (type) {
  type = type.toLowerCase();
  type = type.replace('_', '-');
  if (type === 'wrapper') {
    return baseUrl + type;
  } else {
    return baseUrl + 'types/' + type;
  }
};

module.exports.getTypeObject = function (type, callback) {
  async.auto({
    cache: function (cb) {
      var p = module.exports.resolvePath(type);
      fs.exists(p, function (exists) {
        if (exists) {
          fs.readFile(p, 'utf8', cb);
        } else {
          cb(null);
        }
      });
    },

    request: ['cache', function (cb, r) {
      var body = r.cache;
      if (body) {
        return cb(null, body);
      }

      http.get(module.exports.resolveUrl(type), function (res) {
        res.setEncoding('utf8');
        var body = '';
        if (res.statusCode === 200) {
          res.on('data', function (chunk) {
            body += chunk;
          });
          res.on('end', function () {
            fs.writeFile(module.exports.resolvePath(type), body, function (err) {
              if (err) {
                return cb(err);
              }

              return cb(null, body);
            });
          });
        } else {
          cb(new Error(res.statusCode));
        }
      })
      .on('error', function (e) {
        return cb(e);
      });

    }],

    parse: ['request', function (cb, r) {
      var body = r.request;

      var $ = cheerio.load(body);

      // fields parsing
      var methods = $('div.method');
      var fieldObject = {};
      methods.each(function (i, e) {
        // parsing each field
        var obj = {};
        var content = $(this);
        var methodName = content.find('.method-name');

        if (methodName.find('span.excluded').length === 0) {
          obj.excluded = false
        } else {
          obj.excluded = true;
        }

        if (methodName.find('span.min-version').length !== 0) {
          obj.minVersion = methodName.find('span.min-version').text();
        }

        // remove span elements
        methodName.find('span').remove();

        // parse field description
        var methodDescription = content.find('.method-description');
        var parsed = parseDescription(methodDescription.text().trim());

        Object.keys(parsed).forEach(function (key) {
          if (parsed[key] !== undefined) {
            obj[key] = parsed[key];
          }
        });

        fieldObject[methodName.text().trim()] = obj;
      });


      cb(null, fieldObject);
    }]
  }, function (err, result) {
    if (err) {
      return callback(err);
    }
    var obj = {};
    obj[type] = result.parse;
    return callback(null, obj)
  });
};
