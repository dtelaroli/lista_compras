angular.module('starter.controllers', ['ng-token-auth'])

.config(function($authProvider) {
    $authProvider.configure({
        apiUrl: 'http://localhost:3000'
    });
})

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', ['$scope', 'List', function($scope, List) {
  $scope.lists;
  $scope.list;

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
    new List($scope.list).$save(function(list) {
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
        products.forEach(function(product) {
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
    new Product($scope.product).$save(function(saved) {
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

.controller('AccountCtrl', ['$scope', '$db', '$ionicPopup', 'Account', '$auth', 
    function($scope, $db, $ionicPopup, Account, $auth) {
  $scope.settings = {
    enableFriends: true
  };

  $scope.account = {};
  
  var self = {
    init: function() {
      Account.first().then(function(account) {
        if(account === undefined) {
          $scope.account = new Account();
          $scope.registered = false;
        }
        else {
          $scope.account = new Account(account);
          $scope.registered = true;
          $scope.signed = account.key !== '';
        }
      });
    }
  };

  self.init();

  $scope.create = function() {
    $scope.account.$save(function() {
      self.init();
      $ionicPopup.alert({
        title: 'Criação de conta',
        template: 'Solicitação executada<br />verifique seu email'
      });
    });
  };

  $scope.auth = function() {
    $auth.authenticate('facebook')
    .then(function(resp) { 
      console.log(resp);
    })
    .catch(function(resp) { 
      console.error(resp);
    });

    return;
    $scope.account.$save(function() {
      self.init();
      $ionicPopup.alert({
        title: 'Ativação de conta',
        template: 'Sua conta foi ativada<br />Aproveite o App!'
      });
    });
  };

  $scope.reset = function() {
    $ionicPopup.confirm({
      title: 'Limpar dados',
      template: 'Tem certeza?'
    })
    .then(function(res) {
      if(res) {
        $db.reset().then(function() {
          self.init();
        });        
      }
    });
  };
}]);
