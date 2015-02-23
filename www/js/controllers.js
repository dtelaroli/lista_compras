angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', function($scope, Lists) {
  var self = {
    init: function() {
      $scope.lists = Lists.all();
      $scope.list = {};
    }
  };
  self.init();

  $scope.add = function() {    
    Lists.add($scope.list);
    self.init();
  };

  $scope.archive = function(list) {
    Lists.remove(list);
  };

  $scope.remove = function(list) {
    Lists.remove(list);
  };
})

.controller('ListDetailCtrl', function($scope, $stateParams, Lists) {
  var self = {
    init: function() {
      $scope.list = Lists.get($stateParams.listId);
      $scope.product = {};
    }
  };
  self.init();  

  $scope.add = function() {    
    $scope.list.products.push($scope.product);
    self.init();
  };

  $scope.archive = function(list) {
    Lists.remove(list);
  };

  $scope.remove = function(list) {
    Lists.remove(list);
  };
})

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
