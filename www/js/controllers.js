angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ListsCtrl', function($scope, Lists) {
  var self = {
    init: function() {
      Lists.all().then(function(result) {
        $scope.lists = result;  
      });
      $scope.list = {};
    }
  };
  self.init();

  $scope.add = function() {    
    Lists.add($scope.list);
    self.init();
  };

  $scope.archive = function(list) {
    Lists.remove(list).then(function() {
      self.init();
    });
  };

  $scope.remove = function(list) {
    Lists.remove(list).then(function() {
      self.init();
    });
  };
})

.controller('ListDetailCtrl', function($scope, $stateParams, Lists) {
  var self = {
    init: function() {
      Lists.get($stateParams.listId).then(function(result) {
        $scope.list = result;  
      });
      $scope.product = {};
    }
  };
  self.init();  

  $scope.add = function() {    
    $scope.list.products.push($scope.product);
    self.init();
  };

  $scope.archive = function(list) {
    Lists.remove(list).then(function() {
      self.init();
    });
  };

  $scope.remove = function(list) {
    Lists.remove(list).then(function() {
      self.init();
    });
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
