var se = require('./lib/stackexchange');

se.run(function (err) {
  if (err) {
    console.log('error');
    console.log(err);
    return;
  }
  console.log('done');
});
