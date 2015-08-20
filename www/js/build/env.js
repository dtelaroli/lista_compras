angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
  	PROTOCOL: 'http',
    ENDPOINT: 'localhost:3000',
  };

  return function(name) {
    return self[name];
  }
})