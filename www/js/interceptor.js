angular.module('interceptors', [])
    
.factory('httpInterceptor', ['$q', '$rootScope', function ($q, $rootScope) {
    var parse = function(rejection) {
        $rootScope.$errors = [];
        for(var index in rejection.data) {
            var message = index + ' ' + rejection.data[index].join(' and ');
            $rootScope.$errors.push(message);
        }
        $rootScope.$broadcast('errors');
    };

    var reset = function() {
        $rootScope.$message = null;
        $rootScope.$errors = [];
        NProgress.done();
    };

    $rootScope.$success = function(message) {
        $rootScope.$message = message;
        $rootScope.$broadcast('success');
    };

    return {
        request: function(config) {
            config.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
            config.defaults.headers.common['ContentType'] = 'application/json;UTF-8';
            reset();
            NProgress.start();
            return config;
        },
        response: function(config) { 
            reset();               
            return config;
        },
        responseError: function(rejection) {
            if(rejection.status == 400) {
                parse(rejection);
            }
                  
            NProgress.done();
            return $q.reject(rejection);
        }
    };
}])

.factory('jsonInterceptor', [function() {
    var regexIso8601 = /^(\d{4})-(\d{2})-(\d{2})(\s(\d{2}):(\d{2}):(\d{2})?)?$/;

    function convertDateStringsToDates(input) {
        // Ignore things that aren't objects.
        if (typeof input !== 'object') return input;

        for (var key in input) {
            if (!input.hasOwnProperty(key)) continue;

            var value = input[key];
            var match;
            // Check for string properties which look like dates.
            if (typeof value === 'string' && (match = value.match(regexIso8601))) {
                var date = new Date(match[1], match[2] - 1, match[3]);
                var date_time = new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
                if (date !== null) {
                    input[key] = date;
                }
                else if(date_time !== null) {
                    input[key] = date_time;
                }
            } else if (typeof value === 'object') {
                // Recurse into object
                convertDateStringsToDates(value);
            }
        }
    }

    return {
        response: function(responseData) {
            var converted = convertDateStringsToDates(responseData);
            return converted == null ? responseData : converted;
        }
    };
}])

.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
    $httpProvider.interceptors.push('jsonInterceptor');
}]);