angular.module('starter.services', [])

.run(['$db', '$model', function($db, $model) {
  $db.init();
  $model.init();
}])

.factory('$db', [function() {
    var self = {
      init: function() {
        persistence.store.websql.config(persistence, 'Lista', 'Lista de Compra', 5 * 1024 * 1024);        
      }
    };

    return self;
}])

.factory('$model', [function() {
    var self = {
      init: function() { 
        self.List.hasMany('products', self.Product, 'lists');
        self.Product.hasMany('lists', self.List, 'products');

        persistence.schemaSync(function(tx) {});
      },
      List: persistence.define('List', {
        name: 'TEXT',
        archived: 'BOOL'
      }),
      Product: persistence.define('Product', {
        name: 'TEXT'
      })
    };

    return self;
}])

.factory('$entity', ['$model', '$q', function($model, $q) {
    function entityFactory(name, extras) {      
      var model = $model[name]; 
      var defaults = {
        all: function() {
          var deferred = $q.defer();
          model.all().list(function (list) {
            deferred.resolve(new Entity(list));
          });
          return deferred.promise;
        },

        get: function(id) {
          var deferred = $q.defer();
          model.load(id, function (instance) {
            deferred.resolve(new Entity(instance));
          });
          return deferred.promise;
        },
        
        save: function(params) {
          var deferred = $q.defer();
          var instance = new model(params);
          persistence.add(instance);
          persistence.flush();
          deferred.resolve(instance);
          return deferred.promise;
        },
        
        remove: function(instance) {
          var deferred = $q.defer();
          persistence.remove(instance);
          persistence.flush(function() {
            deferred.resolve(true);
          });
          return deferred.promise;
        }
      };

      function Entity(params) {
        angular.forEach(params, function(param, name) {
          this[name] = param;
        }, this);
      };

      var actions = angular.extend({}, defaults, extras);

      angular.forEach(actions, function(action, name) {
        Entity[name] = function(params, callback) {
          var result = action.call(this, params);
          result.then(function(value) {
            if(callback !== undefined) {
              callback.call(this, value);
            }
          });
          return result.$promise || result;
        };

        Entity.prototype['$' + name] = function(params, callback) {
          if(typeof params === 'function') {
            callback = params;
            params = this;
          }
          return Entity[name].call(this, params, callback);
        };
      });

      return Entity;
    }

    return entityFactory;
}])

.factory('List', ['$q', '$entity', function($q, $entity) {
  var list = $entity('List', {
    add_product: function(product) {
      var deferred = $q.defer();
      this.products.add(product);
      persistence.flush(function() {
        deferred.resolve(product);
      });
      return deferred.promise;
    }
  });
  return list;
}])

.factory('Product', ['$entity', function($entity) {
  return $entity('Product');
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
  }, {
    id: 1,
    name: 'Max Lynx',
    notes: 'Odd obsession with everything',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Andrew Jostlen',
    notes: 'Wears a sweet leather Jacket. I\'m a bit jealous',
    face: 'https://pbs.twimg.com/profile_images/491274378181488640/Tti0fFVJ.jpeg'
  }, {
    id: 3,
    name: 'Adam Bradleyson',
    notes: 'I think he needs to buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 4,
    name: 'Perry Governor',
    notes: 'Just the nicest guy',
    face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
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
