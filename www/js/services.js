angular.module('persistence', [])

.factory('$db', [function() {
  var self = {
    init: function(config) {
      persistence.store.websql.config(persistence, config.name, config.description, config.size);
      self.config = config;
      if(config.models.init !== undefined) {
        config.models.init();
      }
      persistence.schemaSync(function(tx) {});
    },

    models: function(name) {
      return self.config.models[name];
    }
  };
  return self;
}])

.factory('$entity', ['$db', '$q', function($db, $q) {
  function entityFactory(name, extras) {     
    var Entity = $db.models(name);
    var defaults = {
      all: function() {
        var deferred = $q.defer();
        Entity.all().list(function (list) {
          var all = [];
          angular.forEach(list, function(item) {
            this.push(new Model(item));
          }, all);
          deferred.resolve(all);
        });
        return deferred.promise;
      },

      get: function(id) {
        var deferred = $q.defer();
        Entity.load(id, function (instance) {
          deferred.resolve(new Model(instance));
        });
        return deferred.promise;
      },
      
      save: function(params) {
        var deferred = $q.defer();
        var instance = new Entity(params);
        persistence.add(instance);
        persistence.flush();
        deferred.resolve(instance);
        return deferred.promise;
      },
      
      remove: function(instance) {
        var deferred = $q.defer();
        persistence.remove(instance);
        persistence.flush(function(flushed) {
          deferred.resolve(flushed);
        });
        return deferred.promise;
      },

      flush: function() {
        var deferred = $q.defer();
        persistence.flush(function(flushed) {
          deferred.resolve(flushed);
        });
        return deferred.promise;
      }
    };

    function Model(params) {
      angular.forEach(params, function(param, name) {
        this[name] = param;
      }, this);
    };

    var actions = angular.extend({}, defaults, extras);

    angular.forEach(actions, function(action, name) {
      Model[name] = function(params, callback) {
        var result = action.call(this, params);
        if(result !== undefined) {
          result.then(function(value) {
            if(callback !== undefined) {
              callback.call(this, value);
            }
          });
          return result.$promise || result;
        }
        else if(callback !== undefined) {
          return callback.call(this);
        }
      };

      Model.prototype['$' + name] = function(params, callback) {
        if(typeof params === 'function') {
          callback = params;
          params = this;
        }
        return Model[name].call(this, params, callback);
      };
    });

    return Model;
  }

  return entityFactory;
}]);

angular.module('starter.services', ['persistence'])

.run(['$db', '$model', function($db, $model) {
  $db.init({
    name: 'Compras', 
    description: 'Lista de Compra', 
    size: 5 * 1024 * 1024, 
    models: $model
  });
}])

.factory('$model', [function() {
  var self = {
    init: function() { 
      self.List.hasMany('products', self.Product, 'lists');
      self.Product.hasMany('lists', self.List, 'products');
    },

    List: persistence.define('List', {
      name: 'TEXT',
      archived: 'BOOL'
    }),

    Product: persistence.define('Product', {
      name: 'TEXT',
      archived: 'BOOL'
    })
  };

  return self;
}])

.factory('List', ['$q', '$entity', function($q, $entity) {
  var list = $entity('List', {
    add_product: function(product) {
      var deferred = $q.defer();
      this.products.add(product);
      this.$flush(function() {
        deferred.resolve(true);
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
