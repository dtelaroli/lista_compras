angular.module('starter.controllers', ['ng-token-auth', 'ngEnv', 'interceptors'])

.config(function($authProvider, $envProvider) {
  $env = $envProvider.$get();
  $authProvider.configure({
      apiUrl: $env('PROTOCOL') + '://' + $env('ENDPOINT'),
      omniauthWindowType: window.cordova == undefined ? 'newWindow' : 'inAppBrowser'
  });
})

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', ['$scope', '$ionicPopup', 'List', 'ListService', 'AccountService', 'ShareService', 
    function($scope, $ionicPopup, List, ListService, AccountService, ShareService) {
  var self = {
    init: function() {
      $scope.account = AccountService;
      $scope.account.init();
      $scope.lists = ListService;
      $scope.lists.init();
      $scope.list = {};      
    },

    clear: function() {
      $scope.data = {invalid: false};
      $scope.list = {};
    }
  };

  $scope.add = function() {    
    $scope.lists.save($scope.list);
    self.clear();    
  };

  $scope.share = function(list) {
    $ionicPopup.show({
      template: '<input type="email" ng-model="data.email"><p ng-if="data.invalid">Email inválido</p>',
      title: 'Compartilhar',
      subTitle: 'Digite o email do seu amigo',
      scope: $scope,
      buttons: [
        {text: 'Cancelar'},
        {
          text: '<b>Enviar</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data.email) {
              e.preventDefault();
              $scope.data.invalid = true;
            }
            else {                            
              return $scope.data.email;
            }
          }
        }
      ]
    }).then(function(response) {
      ShareService.save({list_id: list.id, email: response}, function(success) {
        $ionicPopup.alert({
          title: 'Confirmação',
          template: 'Lista compartilhada.'
        });
        self.clear();
      });
    });
  };

  $scope.info = function(share) {
    $ionicPopup.alert({
      title: 'Lista Compartilhada',
      template: 'Nome: ' + share.user_name
    })
  };

  $scope.archive = function(list) {
    list.archived = true;
    List.save(list, function() {
      self.init();
    });
  };

  $scope.remove = function(list) {
    List.remove(list).then(function() {
      self.init();
    });
  };

  self.init();
  self.clear();
}])

.controller('ListDetailCtrl', ['$scope', '$stateParams', 'List', 'Product', 'ListProduct',
    function($scope, $stateParams, List, Product, ListProduct) {
  var self = {
    init: function() {
      List.get($stateParams.listId).then(function(list) {
        List.lproducts(list, function(lproducts) {
          $scope.lproducts = lproducts;        
          self.products(lproducts);
        });
        $scope.list = list;        
      });
    },

    products: function(lproducts) {
      var ids = [];
      lproducts.forEach(function(lp) {
        ids.push(lp.product.id);
      });
      Product.filter('id', 'not in', ids, 'name').then(function(products) {    
        $scope.products = [];
        angular.forEach(products, function(product) {
          $scope.products.push({id: product.id, name: product.name});
        })
      });
    },

    clear: function() {
      $scope.product = {};
    }
  };

  $scope.select = function(item) {
    $scope.product = new Product(item);
  }

  $scope.add = function() {
    $scope.product.name = $scope.product.name.toLowerCase();
    Product.save($scope.product, function(saved) {
      ListProduct.save({
        list: $scope.list.id,
        product: saved.id
      }, function(lp) {
        persistence.flush();
        $scope.lproducts.push(lp);
      });
      self.clear();
    });
  };

  $scope.update = function(item) {
    if(item.sync !== 'NEW') {
      item.sync = 'DIRTY';
    }
    ListProduct.save(item);
  };

  $scope.remove = function(lp) {
    ListProduct.remove(lp).then(function() {
      self.init();
    });
  };

  self.init();
  self.clear();
}])

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', ['$scope', '$db', '$ionicPopup', 'AccountService', 'SyncService', '$auth',
    function($scope, $db, $ionicPopup, AccountService, SyncService, $auth) {
  $scope.settings = {
    enableFriends: true
  };

  var self = {
    init: function() {
      $scope.account = AccountService;
      $scope.account.init();
    },

    confirm: function(callback) {
      var alert = $ionicPopup.alert({
        title: 'Confirmação',
        template: 'Operação efetuada com sucesso!'
      });

      if(callback !== undefined) {
        alert.then(callback);
      }
    },

    create: function(response) {
      $scope.account.save(response);
      self.confirm();
    },

    error: function(response) {
      $scope.$emit('app:error', response);
    }
  };

  $scope.google = function() {
    $auth.authenticate('google').then(function(response) {
      self.create(response);
    }, self.error);
  };

  $scope.facebook = function() {
    $auth.authenticate('facebook').then(function(response) { 
      self.create(response);
    }, self.error);
  };

  $scope.sync = function() {
    SyncService.exec().then(function(response) {
      self.confirm(function() {
        $scope.$emit('list:changed');
      });
    }, self.error);
  };

  $scope.reset = function() {
    $ionicPopup.confirm({
      title: 'Limpar dados',
      template: 'Tem certeza?'
    })
    .then(function(option) {
      if(option) {
        $db.reset().then(function() {
          $auth.signOut();
          $scope.account.reset();
        });        
      }
    });
  };

  self.init();
}]);
