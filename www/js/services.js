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
    sync: 'TEXT'
  });

  var Product = persistence.define('Product', {
    name: 'TEXT',
    sync: 'TEXT'
  });

  var ListProduct = persistence.define('ListProduct', {
    ok: 'BOOL',
    sync: 'TEXT'
  });

  List.hasMany('list_products', ListProduct, 'list');
  ListProduct.hasOne('list', List);
  ListProduct.hasOne('product', Product);

  var Share = persistence.define('Share', {
    user_id: 'INT',
    user_name: 'TEXT',
    user_image: 'TEXT',
    created_at: 'DATE',
    sync: 'TEXT'
  });

  Share.hasOne('list', List);

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
    Share: Share,
    Account: Account
  };

  return self;
}])

.factory('List', ['$q', '$entity', 'ListProduct', function($q, $entity, ListProduct) {
  var list = $entity('List', {
    lproducts: function(list) {
      var deferred = $q.defer();

      list.list_products.prefetch('product').list(function(lproducts) {
        deferred.resolve(lproducts);
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

.factory('ShareService', ['$resource', function($resource) {
  return $resource('http://:end_point/shares/:id.:format', {
      end_point: 'localhost:3000', 
      format: 'json'
    });
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
      user_id: object.user.id,
      user_name: object.user.name,
      user_image: object.user.image,
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

  return {
    exec: function() {
      var deferred = $q.defer();
      var error = function(result) {
        deferred.reject(result);
        console.error(result);
      };
      
      ProductSync.exec().then(function(result) {
        ListSync.exec().then(function(result) {
          ListProductSync.exec().then(function(result) {
            ShareSync.exec().then(function(result) {
              deferred.resolve(result);
            }, error);
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
