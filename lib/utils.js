module.exports.capitalize = function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports.toCamelCase = function (str) {
  return str.replace(/(\_[a-z])/g, function(c) {
    return c.toUpperCase().replace('_','');
  });
};

module.exports.toDash = function (str) {
  return replace(/([A-Z])/g, function(c){
    return "-"+c.toLowerCase();
  });
};

module.exports.toUnderscore = function (str) {
  return str.replace(/([A-Z])/g, function(c){
    return "_"+c.toLowerCase();
  });
};
