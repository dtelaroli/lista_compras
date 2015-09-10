angular.module('starter.controllers', ['ng-token-auth'])

.config(function($authProvider) {
  $authProvider.configure({
      apiUrl: 'http://warm-dusk-4656.herokuapp.com',
      omniauthWindowType: window.cordova == undefined ? 'newWindow' : 'inAppBrowser',
      storage: 'localStorage'
  });
})

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, $auth) {
  $scope.user = null;

  $scope.google = function() {
    $auth.authenticate('google').then(function(response) {
      $scope.user = response;
    }).catch(function(error) {
      console.error(error);
    });
  };

  $scope.logout = function() {
    $auth.signOut().then(function() {
      $scope.user = null;
    }).catch(function(error) {
      console.error(error);
      $scope.user = null;
    });
  };

  $scope.validate = function() {
    $auth.validateUser().then(function(user) {
      $scope.user = user;
      console.log($scope.user);
    });
  };

  $scope.validate();

  $scope.settings = {
    enableFriends: true
  };
});
