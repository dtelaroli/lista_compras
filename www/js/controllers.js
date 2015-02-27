angular.module('starter.controllers', [])

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

.controller('ListDetailCtrl', ['$scope', '$stateParams', 'List', 'Product', function($scope, $stateParams, List, Product) {
  $scope.list;
  $scope.product;

  var self = {
    init: function() {
      List.get($stateParams.listId).then(function(list) {
        $scope.list = list;
        list.products.list(function(products) {
          $scope.products = products;
        });
        self.clear();
      });
    },

    clear: function() {
      $scope.product = {};
    }
  };
  self.init();

  $scope.update = function() {
    $scope.list.$flush();
  };

  $scope.add = function() {
    new Product($scope.product).$save(function(saved) {
      $scope.list.$add_product(saved);      
      $scope.products.push(saved);
      self.clear();
    });
  };

  $scope.remove = function(product) {
    Product.remove(product).then(function() {
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

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
