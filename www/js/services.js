angular.module('starter.services', ['ngPersistence', 'ngResource'])

.run(['$db', '$model', '$ionicPlatform', function($db, $model, $ionicPlatform) {
  $db.init({
    name: 'ListaCompras', 
    description: 'Lista de Compra', 
    size: 5 * 1024 * 1024, 
    models: $model,
    reset: false
  });

  ionic.Platform.isFullScreen = true;
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

.factory('Product', ['$entity', function($entity) {
  return $entity('Product');
}])

.factory('ProductService', ['$resource', function($resource) {
  return $resource('http://dtelaroli.org::port/products/:id.:format', {port: 3000, format: 'json'});
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
