angular.module('interceptors', [])
    
.config(function($httpProvider) {
  $httpProvider.interceptors.push(function($rootScope) {
    return {
        request: function(config) {
          $rootScope.$broadcast('loading:show')
            return config
        },
        response: function(response) {
            $rootScope.$broadcast('loading:hide')
            return response
        },
        responseError: function(rejection) {
            switch(rejection.status) {
            case  400:
                parse(rejection);
                break;

            case 401:
                $rootScope.$broadcast('http:401');
                break;
            }

            $rootScope.$broadcast('loading:hide');
            return $q.reject(rejection);
        }
    };
  });
})

.run(function($rootScope, $ionicLoading) {
  $rootScope.$on('loading:show', function() {
    $ionicLoading.show({template: 'Carregando...'});
  });

  $rootScope.$on('loading:hide', function() {
    $ionicLoading.hide();
  });
});