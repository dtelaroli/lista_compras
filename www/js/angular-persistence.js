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
}])

.service('$sync', ['$q', '$resource', '$env', '$entity', function($q, $resource, $env, $entity) {
  function sync(name, resource, parse_in, out) {
    var Model = $entity(name);
    var Service = $resource(':protocol://:end_point/:resource/:id.:format', {
      protocol: $env('PROTOCOL'),
      end_point: $env('ENDPOINT'), 
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
      findAll: function() {
        var deferred = $q.defer();

        Model.filter('sync', 'IN', ['NEW', 'DIRTY', 'TRASH']).then(function(array) {
          var instances = [];
          array.forEach(function(item) {
            if(out === undefined) {
              item.selectJSON(['*'], function(result) {
                instances.push(result);
              });
            }
            else {
              instances.push(out.call(this, item));
            }
          });
          setTimeout(function() {
            deferred.resolve(instances);
          }, 500);
        });
        return deferred.promise;
      },

      sendAll: function() {
        var deferred = $q.defer();        

        self.findAll().then(function(result) {
          if(result.length > 0) {
            return Service.save(result);
          }
          else {
            return result;
          }
        }).then(function(result) {
          if(result.$resolved) {
            angular.forEach(result, function(item) {
              if(item.sync === 'NEW' || item.sync === 'DIRTY') {
                item.sync = 'OK';
                persistence.flush(function() {});
              }
            });
            deferred.resolve(result);
          }
          else {
            deferred.reject(result);
          }
        }).catch(function(result) {
          deferred.reject(result);
        });
        return deferred.promise;
      },

      receiveAll: function() {
        var deferred = $q.defer();
        Service.query(function(array) {
          angular.forEach(array, function(item) {
            item.sync = 'OK';
            Model.save(parse_in === undefined ? item : parse_in.call(this, item));
          });
          deferred.resolve(array);
        }, function(result) {
          deferred.reject(result);
        });
        return deferred.promise;
      }
    };
    
    return function() {
      var deferred = $q.defer();
      self.sendAll()
      .then(self.receiveAll)
      .then(function(result) {
        deferred.resolve(result);
      }).catch(function(result) {
        deferred.reject(result);
      });
      return deferred.promise;
    };
  };

  return sync;
}]);