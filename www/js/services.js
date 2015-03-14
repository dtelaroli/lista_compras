angular.module('starter.services', ['ngPersistence', 'ngResource', 'ngEnv'])

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
  var Sync = persistence.defineMixin('Sync', {
    sync: 'TEXT'
  });

  var List = persistence.define('List', {
    name: 'TEXT',
    archived: 'BOOL',
    created_at: 'DATE'
  });

  var Product = persistence.define('Product', {
    name: 'TEXT'
  });

  var ListProduct = persistence.define('ListProduct', {
    ok: 'BOOL'
  });

  var Share = persistence.define('Share', {
    user_id: 'INT',
    user_name: 'TEXT',
    user_image: 'TEXT',
    created_at: 'DATE',
  });

  var Account = persistence.define('Account', {
    name: 'TEXT',
    email: 'TEXT',
    provider: 'TEXT',
    nickname: 'TEXT',
    image: 'TEXT'
  });

  List.hasMany('list_products', ListProduct, 'list');
  ListProduct.hasOne('list', List);
  ListProduct.hasOne('product', Product);
  Share.hasOne('list', List);

  List.is(Sync);
  Product.is(Sync);
  ListProduct.is(Sync);
  Share.is(Sync);

  var self = {
    Product: Product,
    List: List,
    ListProduct: ListProduct,
    Share: Share,
    Account: Account
  };

  return self;
}])

.factory('List', ['$q', '$entity', 'ListProduct', 'Share', function($q, $entity, ListProduct, Share) {
  var list = $entity('List', {
    lproducts: function(list) {
      var deferred = $q.defer();

      list.list_products.prefetch('product').list(function(lproducts) {
        deferred.resolve(lproducts);
      });

      return deferred.promise;
    },

    share: function(list) {
      var deferred = $q.defer();

      Share.filter('list', '=', list.id).then(function(shares) {
        deferred.resolve(shares.length === 0 ? null : shares[0]);
      });

      return deferred.promise;
    }
  });
  return list;
}])

.factory('Product', ['$entity', function($entity) {
  return $entity('Product');
}])

.factory('ListProduct', ['$entity', function($entity) {
  return $entity('ListProduct', {});
}])

.factory('Account', ['$entity', function($entity) {
  return $entity('Account');
}])

.factory('Share', ['$entity', function($entity) {
  return $entity('Share');
}])

.factory('ShareService', ['$resource', '$env', function($resource, $env) {
  return $resource(':protocol://:end_point/shares/:id.:format', {
    protocol: $env('PROTOCOL'),  
    end_point: $env('ENDPOINT'), 
    format: 'json'
  });
}])

.service('ListService', ['List', function(List) {
  var self = {
    init: function() {
      List.all().then(function(lists) {
        angular.forEach(lists, function(list) {
          List.share(list, function(share) {
            if(share !== null) {
              list.shared = share;
            }
          });
        });
        self.set(lists);
      });
    },

    data: [],

    set: function(lists) {
      self.data = lists;
    },

    save: function(list) {
      list.created_at = new Date();
      List.save(list, function(result) {
        self.data.push(result);
      });
    }
  };

  return self;
}])

.service('AccountService', ['$q', 'Account', function($q, Account) {
  var self = {
    init: function() {
      var deferred = $q.defer();
      Account.first().then(function(account) {
        self.set(account);
        deferred.resolve(account);
      });
      return deferred.promise;
    },

    save: function(account) {
      var deferred = $q.defer();
      Account.save(account, function(account) {
        self.set(account);
        deferred.resolve(account);
      });
      return deferred.promise;
    },

    set: function(account) {
      self.data = account;
      self.state = account === undefined ? 'Unsigned' : 'Signed';
    },

    reset: function() {
      self.set(undefined);
    },

    data: null,

    state: 'Unsigned'
  };

  return self;
}])

.service('SyncService', ['$q', '$sync', 'List', 'ListProduct', function($q, $sync, List, ListProduct) {
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
  var ShareSync = $sync('Share', 'shares', function(object) {
    object.list.sync = 'OK';
    List.save(object.list);
    angular.forEach(object.list_products, function(lp) {
      ListProduct.save({
        id: lp.id,
        list: lp.list_id,
        product: lp.product_id,
        ok: lp.ok,
        sync: 'OK'
      });
    });
    return {
      user_id: object.by.id,
      user_name: object.by.name,
      user_image: object.by.image,
      list: object.list.id,
      created_at: object.created_at,
      sync: 'OK'
    }
  }, function(object) {
    return {
      user_id: object.user_id,
      list_id: object.list.id,
      created_at: object.created_at
    }
  });

  var self = {
    exec: function() {
      var deferred = $q.defer();
            
      ProductSync()
        .then(ListSync)
        .then(ListProductSync)
        .then(ShareSync)
        .then(function(result) {
          deferred.resolve(result);
        }).catch(function(result) {
          deferred.reject(result);
        });
      return deferred.promise;
    }
  };
  
  return self;
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
})

.service('authService', ['$http', '$stateParams', '$q', '$location', '$window', '$auth',
  function ($http, $stateParams, $q, $location, $window, $auth) {
    var APIURL = 'http://dtelaroli.org';
    var _this = this;

    //stubUrl to get around angular url '#' check on the backend (via devise_token_auth)
    this.stubUrl = "http://localhost:8100/#/tab/account";
    this.authUrl = APIURL + '/auth/google_oauth2/?auth_origin_url=' + _this.stubUrl;


    this.login = function() {
      if(window.cordova) {
        var deferred = $q.defer();
        //open IAB window
        var browserWindow = $window.open(_this.authUrl, '_blank', 'location=no');

        // listen for IAB window finish loading
        browserWindow.addEventListener( "loadstop", function() {
          //grab linkedin authcode from url response
          getAuthCodeFromResponse(browserWindow)
            .then(function(success){
              deferred.resolve(success);
            }, function(err){
              deferred.reject(err);
            })
        });
        return deferred.promise;
      }
      else {
        return $auth.authenticate('google');
      }
    }

    // function called when the browser is closed
    function browserOnClose (output){
//      get code from response url
      var code = output.url.toString(),
          authResponse = output.response[0],
          authResponseQueryString = authResponse.substr(authResponse.indexOf("#") + 1),
          clientIdRegex = /\?client_id=(.*)&amp;expiry/,
          expiryRegex = /expiry=(.*)&amp;token/,
          tokenRegex = /token=(.*)&amp;uid/,
          uidRegex = /uid=(.*)<\/p>/,
          clientId = authResponseQueryString.match(clientIdRegex)[1],
          expiry = authResponseQueryString.match(expiryRegex)[1],
          token = authResponseQueryString.match(tokenRegex)[1],
          uid = authResponseQueryString.match(uidRegex)[1],
          user = {
            client_id: clientId,
            expiry: expiry,
            auth_token: token,
            uid: uid
          };

      $auth.initDfd();
      $auth.handleValidAuth(user, true);
      return user;
    }

    function getAuthCodeFromResponse(browserWindow){
      var deferred = $q.defer();
      // we get the url everythime the page loads
      browserWindow.executeScript({code: "document.URL" },

        //that url is passed to this function
        function( url ) {
          var _url = url.toString();

          // we check if the callback page was reached
          if(_url.indexOf("callback") > -1){
            // the callback page was reached therefore it contains the json output returned from the server
            // we parse the html page to strip out the html tags and keep the json string
            browserWindow.executeScript({code: "document.body.innerHTML" }, function(response){
              browserWindow.close();
              // we close the window and call this function with the url and the json output
              var user = browserOnClose({url: url, response: response});
              deferred.resolve(user);   
            });
          }
        }
      );
      return deferred.promise;
    }
  }
]);
