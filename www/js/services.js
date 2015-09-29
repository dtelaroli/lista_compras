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

.service('SyncService', ['$q', 'List', 'ListProduct', function($q, List, ListProduct) {
  var self = {
    run: function() {
      var deferred = $q.defer();
      List.sync('http://localhost:3000/lists.json').then(function(foo) {
        console.log(foo);
      }).catch(function(error) {
        console.error(error);
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
});
