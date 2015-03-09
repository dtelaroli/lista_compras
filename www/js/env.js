angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
    ENDPOINT: '@@ENDPOINT'
  };

  return function(name) {
    return self[name];
  }
})