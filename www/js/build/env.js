angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
    ENDPOINT: 'dtelaroli.org'
  };

  return function(name) {
    return self[name];
  }
})