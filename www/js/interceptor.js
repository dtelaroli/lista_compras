angular.module('interceptors', [])
    
.config(function($httpProvider) {
  $httpProvider.interceptors.push(function($q, $rootScope) {
    return {
      request: function(config) {
        $rootScope.$broadcast('loading:show')
        return config;
      },
      response: function(response) {
        $rootScope.$broadcast('loading:hide')
        return response;
      },
      responseError: function(rejection) {
        switch(rejection.status) {
        case  200:
            break;

        case 401:
            $rootScope.$broadcast('app:error', rejection);
            break;

        default:
            $rootScope.$broadcast('app:error', rejection);
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
    console.log(rejection)
    var errors = ['Erro desconhecido'];
    if(rejection !== undefined) {
      errors = rejection.data === undefined ? rejection.errors : rejection.data.errors
    }
    $ionicPopup.alert({
      title: 'Erro',
      template: errors.join('<br />')
    });
  });
});