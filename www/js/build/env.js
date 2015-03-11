angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
  	PROTOCOL: 'http',
    ENDPOINT: 'dtelaroli.org',
  };

  return function(name) {
    return self[name];
  }
})