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
    provider: 'TEXT',
    nickname: 'TEXT',
    image: 'TEXT'
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
      ListProduct.save({
        list: self,
        product: product
      }, function(lp) {
        self.$flush(function() {
          deferred.resolve(lp);
        });
      });
      return deferred.promise;
    }
  });
  return list;
}])

.factory('$sync', ['$q', '$resource', '$entity', function($q, $resource, $entity) {
  function sync(name, resource, parse_in, out) {
    var Model = $entity(name);
    var Service = $resource('http://:end_point/:resource/:id.:format', {
      end_point: 'localhost:3000', 
      resource: resource,
      format: 'json'
    }, {
      update: {
        method: 'PATCH',
        params: {
          id: '@id'
        }
      }
    });

    var self = {
      sendAll: function() {
        var deferred = $q.defer();        
        Model.filter('sync', '=', false).then(function(lists) {
          angular.forEach(lists, function(list) {
            var dec = out === undefined ? JSON.decycle(list) : out.call(this, list);
            delete dec['_session'];
            delete dec['_data'];
            delete dec['_data_obj'];
            delete dec['subscribers'];
            delete dec['_new'];
            delete dec['_dirtyProperties'];
            delete dec['_type'];
            var callback = function(result) {
              list.sync = true;
              Model.save(list);
            };
            if(dec.sync) {
              Service.update(dec, callback);
            }
            else {
              Service.save(dec, callback);
            }
          });
          deferred.resolve(true);
        });
        return deferred.promise;
      },

      receiveAll: function() {
        var deferred = $q.defer();
        Service.query(function(lists) {
          angular.forEach(lists, function(list) {
            list.sync = true;
            Model.save(parse_in === undefined ? list : parse_in.call(this, list));
          });
          deferred.resolve(true);
        }, function(result) {
          deferred.reject(result);
        });
        return deferred.promise;
      },

      exec: function() {
        var deferred = $q.defer();
        self.receiveAll().then(function() {
          self.sendAll().then(function() {
            deferred.resolve(true);
          });
        });
        return deferred.promise;
      }
    };
    return self;
  };

  return sync;
}])


.factory('Product', ['$entity', function($entity) {
  return $entity('Product');
}])

.factory('ListProduct', ['$entity', function($entity) {
  return $entity('ListProduct');
}])

.factory('Account', ['$entity', function($entity) {
  return $entity('Account');
}])

.factory('SyncService', ['$q', '$sync', 'List', function($q, $sync, List) {
  var ListSync = $sync('List', 'lists');
  var ProductSync = $sync('Product', 'products');
  var ListProductSync = $sync('ListProduct', 'list_products', function(object) {
    return {
      id: object.id,
      list: object.list_id,
      product: object.product_id,
      ok: object.ok
    };
  }, function(object) {
    return {
      id: object.id,
      list_id: object.list.id,
      product_id: object.product.id,
      ok: object.ok
    };
  });
  return {
    exec: function() {
      var deferred = $q.defer();
      var error = function(result) {
        deferred.reject(result);
      };
      ProductSync.exec().then(function(result) {
        ListSync.exec().then(function(result) {
          ListProductSync.exec().then(function(result) {
            deferred.resolve(result);
          }, error);
        }, error);
      }, error);
      return deferred.promise;
    }
  };
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
