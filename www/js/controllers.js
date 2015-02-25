angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', ['$scope', 'List', function($scope, List) {
  var self = {
    init: function() {
      List.all().list(function(result) {
        $scope.lists = result;
      });
      $scope.list = {};
    }
  };
  self.init();

  $scope.add = function() {    
    List.add($scope.list);
    self.init();
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
  var self = {
    init: function() {
      List.get($stateParams.listId).then(function(result) {
        $scope.list = result;
        Product.all().then(function(result) {
          $scope.products = result;
        });
      });
      $scope.product = {};
    }
  };
  self.init();  

  $scope.add = function() {    
    List.Product.add($scope.list, $scope.product);
    self.init();
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
