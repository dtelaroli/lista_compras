angular.module('starter.controllers', ['ng-token-auth'])

.config(function($authProvider) {
    $authProvider.configure({
        apiUrl: 'http://localhost:3000'
    });
})

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', ['$scope', '$ionicPopup', 'List', 'Account', 'ShareService', function($scope, $ionicPopup, List, Account, ShareService) {
  var self = {
    init: function() {
      $scope.account = {};
      List.all().then(function(lists) {
        angular.forEach(lists, function(list) {
          List.share(list, function(share) {
            list.shared = share;
          });
        });     
        $scope.lists = lists;
        self.clear();
      });
      Account.first().then(function(account) {
        $scope.account = account;
      });
    },

    clear: function() {
      $scope.data = {invalid: false};
      $scope.list = {};
    }
  };
  self.init();

  $scope.add = function() { 
    $scope.list.created_at = new Date();
    List.save($scope.list, function(list) {
      $scope.lists.push(list);
      self.clear();
    });
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
      }, function(result) {
        if(result.status === 0) {
          result = '404';
        }
        
        $ionicPopup.alert({
          title: 'Confirmação',
          template: result.data.errors.join('<br />')
        });
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
        self.clear();
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
  self.init();

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
}])

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', ['$scope', '$window', '$db', '$ionicPopup', 'Account', 'Product', 'SyncService', '$auth',
    function($scope, $window, $db, $ionicPopup, Account, Product, SyncService, $auth) {
  $scope.settings = {
    enableFriends: true
  };

  var self = {
    init: function() {
      $scope.account = {};
      Account.first().then(function(account) {
        if(account === undefined) {
          $scope.state = 'Unsigned';
        }
        else {
          $scope.account = account;
          $scope.state = 'Signed';
        }
      });
    },

    confirm: function() {
      self.init();
      $ionicPopup.alert({
        title: 'Confirmação',
        template: 'Operação efetuada com sucesso!'
      });
    },

    error: function(errors) {  
      switch(typeof errors) {
        case 'object':
          errors = errors.data.errors;
          break;
          
        case 'string':
          errors = [errors];
          break;
        case undefined:
          var errors = ['Indefinido'];
          break;

      }
      $ionicPopup.alert({
        title: 'Erro',
        template: errors.join('<br />')
      });
    },

    create: function(response) {
      Account.save(response, function() {
        self.confirm();
      });
    }
  };

  self.init();  

  $scope.google = function() {
    $auth.authenticate('google').then(function(response) {
      self.create(response);
    }, function(response) { 
      self.error(response);
    });
  };

   $scope.facebook = function() {
    $auth.authenticate('facebook').then(function(response) { 
      self.create(response);
    }, function(response) { 
      self.error(response);
    });
  };

  $scope.sync = function() {
    SyncService.exec().then(function(response) {
      self.confirm();
      $ionicPopup.alert({
        title: 'Confirmação',
        template: 'Operação efetuada com sucesso!'
      }).then(function() {
        $window.location.reload(true);
      });
    }, function(response) {
      self.error(response);
    });
  };

  $scope.reset = function() {
    $ionicPopup.confirm({
      title: 'Limpar dados',
      template: 'Tem certeza?'
    })
    .then(function(response) {
      if(response) {
        $db.reset().then(function() {
          $auth.signOut();
          self.init();
        });        
      }
    });
  };
}]);
