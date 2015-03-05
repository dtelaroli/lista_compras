angular.module('starter.services', ['ngPersistence', 'ngResource'])

.run(['$db', '$model', function($db, $model) {
  $db.init({
    name: 'ListaCompras', 
    description: 'Lista de Compra', 
    size: 5 * 1024 * 1024, 
    models: $model,
    reset: false
  });  
}])

.factory('$model', [function() {
  var List = persistence.define('List', {
    name: 'TEXT',
    archived: 'BOOL',
    created_at: 'DATE',
    sync: 'BOOL'
  });

  var Product = persistence.define('Product', {
    name: 'TEXT',
    sync: 'BOOL'
  });

  var ListProduct = persistence.define('ListProduct', {
    ok: 'BOOL',
    sync: 'BOOL'
  });

  List.hasMany('list_products', ListProduct, 'list');
  ListProduct.hasOne('list', List);
  ListProduct.hasOne('product', Product);

  var Account = persistence.define('Account', {
    name: 'TEXT',
    email: 'TEXT',
    user_id: 'INT',
    provider: 'TEXT',
    auth_token: 'TEXT',
    uid: 'TEXT',
    nickname: 'TEXT'
  });

  var self = {
    List: List,
    ListProduct: ListProduct,
    Product: Product,
    Account: Account
  };

  return self;
}])

// .service('authService', ['$http', '$stateParams', '$q', '$location', '$window', '$auth',
//   function ($http, $stateParams, $q, $location, $window, $auth) {
   
//   var _this = this;
//   var APIURL = 'http://dtelaroli.org';
   
//   //stubUrl to get around angular url '#' check on the backend (via devise_token_auth)
//   this.stubUrl = "http://localhost:8100/#/tab/account";
//   this.authUrl = APIURL + '/auth/google_oauth2/?auth_origin_url=' + _this.stubUrl;
   
   
//   this.login = function(){
//     var deferred = $q.defer();
//     //open IAB window
//     var browserWindow = $window.open(_this.authUrl, '_blank', 'location=no');
     
//     // listen for IAB window finish loading
//     browserWindow.addEventListener( "loadstop", function() {
//     //grab linkedin authcode from url response
//       getAuthCodeFromResponse(browserWindow).then(function(success){
//         deferred.resolve();
//       }, function(err){
       
//       })
//     });
//     return deferred.promise
//   }
   
//   // function called when the browser is closed
//   function browserOnClose (output){
//     // get code from response url
//     var code = output.url.toString(),
//     authResponse = output.response[0],
//     authResponseQueryString = authResponse.substr(authResponse.indexOf("#") + 1),
//     clientIdRegex = /\?client_id=(.*)&amp;expiry/,
//     expiryRegex = /expiry=(.*)&amp;token/,
//     tokenRegex = /token=(.*)&amp;uid/,
//     uidRegex = /uid=(.*)<\/p>/,
//     clientId = authResponseQueryString.match(clientIdRegex)[1],
//     expiry = authResponseQueryString.match(expiryRegex)[1],
//     token = authResponseQueryString.match(tokenRegex)[1],
//     uid = authResponseQueryString.match(uidRegex)[1],
//     user = {
//       client_id: clientId,
//       expiry: expiry,
//       auth_token: token,
//       uid: uid
//     };
     
//     console.log(authResponseQueryString);
//     $auth.initDfd();
//     $auth.handleValidAuth(user, true);
//   }
   
//   function getAuthCodeFromResponse(browserWindow){
//     var deferred = $q.defer();
//     // we get the url everythime the page loads
//     browserWindow.executeScript({code: "document.URL" },
     
//       //that url is passed to this function
//       function( url ) {
//         var _url = url.toString();
//          alert('ff')
//         // we check if the callback page was reached
//           // the callback page was reached therefore it contains the json output returned from the server
//           // we parse the html page to strip out the html tags and keep the json string
//           browserWindow.executeScript({code: "document.body.innerHTML" },function(response){
//             browserWindow.close();
//             // we close the window and call this function with the url and the json output
//             browserOnClose({url: url, response: response});
//             deferred.resolve();
//           });
//       }
//     );
//     return deferred.promise
//   }
   
//   }
// ]) 

.factory('List', ['$q', '$entity', 'ListProduct', function($q, $entity, ListProduct) {
  var list = $entity('List', {
    lproducts: function() {
      var deferred = $q.defer();

      this.list_products.prefetch('product').list(function(lproducts) {
        deferred.resolve(lproducts);
      });

      return deferred.promise;
    },

    add_product: function(product) {
      var deferred = $q.defer();

      var self = this;
      new ListProduct({
        list: self,
        product: product
      }).$save(function(lp) {
        self.$flush(function() {
          deferred.resolve(lp);
        });
      });
      return deferred.promise;
    }
  });
  return list;
}])

.factory('ListService', ['$resource', function($resource) {
  return $resource('http://:end_point/lists/:id.:format', {end_point: 'localhost:3000', format: 'json'});
}])

.factory('ListSync', ['$q', 'List', 'ListService', function($q, List, ListService) {
  var self = {
    saveAll: function() {
      var deferred = $q.defer();
      List.filter('sync', '=', false).then(function(lists) {
        angular.forEach(lists, function(list) {
          ListService.save(list, function(result) {
            list.sync = true;
            console.log(list)
            list.$flush();
          });
        });
        deferred.resolve(true);
      });
      return deferred.promise;
    },

    loadAll: function() {
      var deferred = $q.defer();
      ListService.query(function(lists) {
        angular.forEach(lists, function(list) {
          list.sync = true;
          List.save(list);
        });
        deferred.resolve(true);
      });
      return deferred.promise;
    },

    exec: function() {
      var deferred = $q.defer();
      self.loadAll().then(function() {
        self.saveAll().then(function() {
          deferred.resolve(true);
        });
      });
      return deferred.promise;
    }
  };

  return self;
}])

.factory('Product', ['$entity', function($entity) {
  return $entity('Product');
}])

.factory('ProductService', ['$resource', function($resource) {
  return $resource('http://:end_point/products/:id.:format', {end_point: 'localhost:3000', format: 'json'});
}])

.factory('ProductSync', ['$q', 'Product', 'ProductService', function($q, Product, ProductService) {
  var self = {
    saveAll: function() {
      var deferred = $q.defer();
      Product.filter('sync', '=', false).then(function(products) {
        angular.forEach(products, function(product) {
          ProductService.save(product, function(result) {
            product.sync = true;
            Product.save(product);
          });
        });
        deferred.resolve(true);
      });
      return deferred.promise;
    },

    loadAll: function() {
      var deferred = $q.defer();
      ProductService.query(function(products) {
        angular.forEach(products, function(product) {
          product.sync = true;
          Product.save(product);
        });
        deferred.resolve(true);
      });
      return deferred.promise;
    },

    exec: function() {
      var deferred = $q.defer();
      self.loadAll().then(function() {
        self.saveAll().then(function() {
          deferred.resolve(true);
        });
      });
      return deferred.promise;
    }
  };

  return self;
}])

.factory('ListProduct', ['$entity', function($entity) {
  return $entity('ListProduct');
}])

.factory('Account', ['$entity', function($entity) {
  return $entity('Account');
}])

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [{
    id: 0,
    name: 'Ben Sparrow',
    notes: 'Enjoys drawing things',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }];


  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
});
