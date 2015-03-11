angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
  	PROTOCOL: 'https',
    ENDPOINT: 'dtelaroli.org',
  };

  return function(name) {
    return self[name];
  }
})