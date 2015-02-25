angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', ['$scope', 'List', function($scope, List) {
  var self = {
    init: function() {
      List.all().then(function(result) {
        $scope.lists = result;
      });
      $scope.list = {};
    }
  };
  self.init();

  $scope.add = function() {    
    List.save($scope.list).then(function() {
      self.init();
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
  var self = {
    init: function() {
      List.get($stateParams.listId).then(function(result) {
        $scope.list = result;
      });
      $scope.product = {};
    }
  };
  self.init();

  $scope.update = function(list) {
    List.save(list).then(function(result) {
      console.log('ok', result);
    });
  };

  $scope.add = function() {
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
