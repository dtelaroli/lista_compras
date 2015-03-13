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
            case  200:
                break;

            case 401:
                $rootScope.$broadcast('http:401');
                break;

            default:
                $rootScope.$broadcast('http:error', rejection);
            }

            $rootScope.$broadcast('loading:hide');
            return $q.reject(rejection);
        }
    };
  });
})

.run(function($rootScope, $ionicLoading, $ionicPopup) {
  $rootScope.$on('loading:show', function() {
    $ionicLoading.show({template: 'Carregando...'});
  });

  $rootScope.$on('loading:hide', function() {
    $ionicLoading.hide();
  });

  $rootScope.$on('app:error', function(event, rejection) {
    $ionicPopup.alert({
      title: 'Erro',
      template: rejection.errors.join('<br />')
    });
  });
});