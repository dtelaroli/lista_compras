angular.module('persistence', [])

.factory('$db', [function() {
  var self = {
    init: function(config) {
      persistence.store.websql.config(persistence, config.name, config.description, config.size);
      self.models = config.models;
      if(config.models.init !== undefined) {
        config.models.init();
      }
      if(config.reset) {
        self.reset();
      }
      persistence.schemaSync();
    },

    reset: function() {
      persistence.transaction(function(tx) {
        persistence.reset(tx);        
      });
    },

    model: function(name) {
      return self.models[name];
    }
  };
  return self;
}])

.factory('$entity', ['$db', '$q', function($db, $q) {
  function modelFactory(name, extras) {     
    var Entity = $db.model(name);
    var defaults = {
      all: function() {
        var deferred = $q.defer();
        Entity.all().list(function(list) {
          var all = [];
          list.forEach(function(item) {
            all.push(new Model(item));
          });
          deferred.resolve(all);
        });
        return deferred.promise;
      },

      filter: function(params) {
        var deferred = $q.defer();
        var all = Entity.all().filter(params[0], params[1], params[2]);

        if(params[3] !== undefined) {
          all = all.order(params[3]);
        }

        all.list(function(list) {
          deferred.resolve(list);
        });

        return deferred.promise;
      },

      get: function(id) {
        var deferred = $q.defer();
        Entity.load(id, function(instance) {
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
        if(arguments.length > 2) {
          params = [arguments[0], arguments[1], arguments[2], arguments[3]];
        }
        var result = action.call(this, params);
        if(result !== undefined) {
          result.then(function(value) {
            if(typeof callback === 'function') {
              callback.call(this, value);
            }
          });
          return result.$promise || result;
        }
        else if(typeof callback === 'function') {
          return callback.call(this);
        }
      };

      Model.prototype['$' + name] = function(params, callback) {
        if(typeof params === 'function') {
          callback = params;
          params = this;
        }
        if(arguments.lenth > 2) {
          params = arguments;
          var last = arguments[arguments.lenth - 1];
          if(typeof last === 'function') {
            callback = last;
          }
        }
        return Model[name].call(this, params, callback);
      };
    });

    return Model;
  }

  return modelFactory;
}]);

angular.module('starter.services', ['persistence'])

.run(['$db', '$model', '$ionicPlatform', function($db, $model, $ionicPlatform) {
  $db.init({
    name: 'ListaCompras2', 
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
    created_at: 'DATE'
  });

  var Product = persistence.define('Product', {
    name: 'TEXT'
  });

  var ListProduct = persistence.define('ListProduct', {
    ok: 'BOOL'
  });

  List.hasMany('list_products', ListProduct, 'list');
  ListProduct.hasOne('list', List);
  ListProduct.hasOne('product', Product);

  var self = {
    List: List,
    ListProduct: ListProduct,
    Product: Product
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

.factory('ListProduct', ['$entity', function($entity) {
  return $entity('ListProduct');
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
