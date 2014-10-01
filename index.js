var optimist = require('optimist');
var argv = optimist.argv;

if (!argv.mod) {
  console.log('requires module name');
  process.exit(1);
  return;
}

var mod = require('./lib/' + argv.mod);
if (mod === undefined || mod === null) {
  console.log('module ' + argv.mod + ' is not found');
}

if (mod) {
  mod.run(function (err) {
    if (err) {
      console.log('error');
      console.log(err);
      return;
    }
    console.log('done');
  });
}
