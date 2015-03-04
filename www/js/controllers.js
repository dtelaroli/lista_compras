angular.module('starter.controllers', ['ng-token-auth'])

.config(function($authProvider) {
    $authProvider.configure({
        apiUrl: 'http://dtelaroli.org'
    });
})

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', ['$scope', 'List', function($scope, List) {
  var self = {
    init: function() {
      List.all().then(function(lists) {
        $scope.lists = lists;
        self.clear();
      });      
    },

    clear: function() {
      $scope.list = {};
    }
  };
  self.init();

  $scope.add = function() { 
    $scope.list.created_at = new Date();
    List.save($scope.list, function(list) {
      console.log($scope.lists)
      $scope.lists.push(list);
      self.clear();
    });
  };

  $scope.archive = function(list) {
    List.remove(list).then(function() {
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
  $scope.list;
  $scope.product;
  $scope.lproducts;
  $scope.products = [];

  var self = {
    init: function() {
      List.get($stateParams.listId).then(function(list) {
        list.$lproducts(function(lproducts) {
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
      $scope.list.$add_product(saved, function(lp) {
        $scope.lproducts.push(lp);        
      });
      self.clear();
    });
  };

  $scope.update = function() {
    $scope.list.$flush();
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

.controller('AccountCtrl', ['$scope', '$db', '$ionicPopup', 'Account', 'Product', 'ProductSync', '$auth', 'authService',
    function($scope, $db, $ionicPopup, Account, Product, ProductSync, $auth, authService) {
  $scope.settings = {
    enableFriends: true
  };

  $scope.account = {};
  
  var self = {
    init: function() {
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
        title: 'Sucesso',
        template: 'Login efetuado com sucesso.<br />Aproveite o App!'
      });
    },

    error: function(errors) {      
      $ionicPopup.alert({
        title: 'Erro',
        template: 'Ocorreu um problema ao logar!<br />' + errors.join('<br />')
      });
    },

    create: function(response) {
      Account.save({
        name: response.name, 
        email: response.email, 
        user_id: response.id,
        provider: response.provider
      }, function() {
        self.confirm();
      });
    }
  };

  self.init();  

  $scope.google = function() {
    authService.login().then(function(response) { 
      self.create(response);
    })
    .catch(function(response) { 
      self.error(response.errors)
    });
  };

   $scope.facebook = function() {
    $auth.authenticate('facebook').then(function(response) { 
      self.create(response);
    })
    .catch(function(resp) { 
      console.error('error', resp);
    });
  };

  $scope.sync = function() {
    ProductSync.exec(function(p) {
      console.log(p)
    });
    // Product.all().then(function(products) {
    //   products.forEach(function(product) {
    //     var sync = new ProductSync({sqlite_id: product.id, name: product.name});
    //     // sync.$save(function(obj) {
    //     //   console.log(obj)
    //     // });
    //   });
    // });
  };

  $scope.reset = function() {
    $ionicPopup.confirm({
      title: 'Limpar dados',
      template: 'Tem certeza?'
    })
    .then(function(res) {
      if(res) {
        $db.reset().then(function() {
          $auth.signOut();
          self.init();
        });        
      }
    });
  };
}]);
