angular.module('ngEnv', [])

.service('$env', function() {
  var self = {
  	PROTOCOL: 'https',
    ENDPOINT: 'warm-dusk-4656.herokuapp.com',
  };

  return function(name) {
    return self[name];
  }
})