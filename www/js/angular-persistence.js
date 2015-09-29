angular.module('ngPersistence', ['ngEnv'])

.factory('$db', ['$q', function($q) {
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
      else {
        persistence.schemaSync();
      }
    },

    reset: function() {
      deferred = $q.defer();
      persistence.transaction(function(tx) {
        persistence.reset(tx);
        persistence.schemaSync(function() {
          deferred.resolve(true);
        });

      });
      return deferred.promise;
    },

    model: function(name) {
      return self.models[name];
    }
  };
  return self;
}])

.factory('$entity', ['$db', '$q', function($db, $q) {
  function modelFactory(name, extras, prefetchs) {     
    var Entity = $db.model(name);

    var _all = Entity.all();
    if(prefetchs !== undefined) {
      angular.forEach(prefetchs, function(p) {
        _all = _all.prefetch(p);
      });
    };
    var defaults = {
      all: function(full) {
        var deferred = $q.defer();
        (full ? _all : _all.filter('sync', '<>', 'TRASH')).list(function(list) {
          deferred.resolve(list);
        });
        return deferred.promise;
      },

      first: function() {
        var deferred = $q.defer();
        _all.limit(1).list(function(list) {
          deferred.resolve(list[0]);
        });
        return deferred.promise;
      },

      filter: function(params) {
        var deferred = $q.defer();
        var filter = _all.filter(params[0], params[1], params[2]);

        if(params[3] !== undefined) {
          filter = filter.order(params[3]);
        }

        filter.list(function(list) {
          deferred.resolve(list);
        });

        return deferred.promise;
      },

      get: function(id) {
        var deferred = $q.defer();
        Entity.load(id, function(instance) {
          deferred.resolve(instance);
        });
        return deferred.promise;
      },
      
      save: function(params) {
        var deferred = $q.defer();
        if(params.sync === undefined) {
          if(params.id === undefined) {
            params.sync = 'NEW';
          }
          else {
            params.sync = 'DIRTY';
          }
        }
        delete params.id;
        var instance = new Entity(params);
        persistence.add(instance);
        persistence.flush(function() {
          deferred.resolve(instance);
        });
        return deferred.promise;
      },
      
      remove: function(instance) {
        var deferred = $q.defer();   
        if(instance.sync === 'NEW') {
          persistence.remove(instance);
        }
        else {
          instance.sync = 'TRASH';
          persistence.flush();
        }
        deferred.resolve(true);
        return deferred.promise;
      },

      flush: function() {
        var deferred = $q.defer();
        persistence.flush(function(flushed) {
          deferred.resolve(flushed);
        });
        return deferred.promise;
      },

      sync: function(url) {
        var deferred = $q.defer();
        Entity.enableSync(url);
        Entity.syncAll(function(conflict) {
          deferred.resolve(conflict);
        }, function(success) {
          deferred.resolve(success)
        }, function(error) {
          deferred.reject(error);
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
              return callback.call(this, value);
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