angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
  	PROTOCOL: '@@PROTOCOL',
    ENDPOINT: '@@ENDPOINT',
  };

  return function(name) {
    return self[name];
  }
})