angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
    ENDPOINT: 'localhost:3000'
  };

  return function(name) {
    return self[name];
  }
})