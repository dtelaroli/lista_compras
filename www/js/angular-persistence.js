angular.module('ngPersistence', [])

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

    var _all = Entity.all().filter('sync', '<>', 'TRASH');
    if(prefetchs !== undefined) {
      angular.forEach(prefetchs, function(p) {
        _all = _all.prefetch(p);
      });
    };
    var defaults = {
      all: function() {
        var deferred = $q.defer();
        _all.list(function(list) {
          deferred.resolve(list);
        });
        return deferred.promise;
      },

      first: function() {
        var deferred = $q.defer();
        Entity.all().limit(1).list(function(list) {
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
        console.log(instance)
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

.service('$sync', ['$q', '$resource', '$entity', function($q, $resource, $entity) {
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
        Model.filter('sync', 'IN', ['NEW', 'DIRTY', 'TRASH']).then(function(array) {
          var instances = [];
          angular.forEach(array, function(item) {
            item = out === undefined ? JSON.decycle(item) : out.call(this, item);
            var black = ['_session', '_data', '_data_obj', 'subscribers', '_new', '_dirtyProperties', '_type'];
            for(var i in black) {
                delete item[black[i]];
            }
            this.push(item);          
          }, instances);
          if(instances.length > 0) {
            Service.save(instances, function(result) {
              angular.forEach(array, function(item) {
                if(item.sync === 'NEW' || item.sync === 'DIRTY') {
                  item.sync = 'OK';
                  persistence.flush(function() {});
                }
              });
              deferred.resolve(true);  
            }, function(result) {
              deferred.reject(result);
            });
          }
          else {
            deferred.resolve(true);
          }
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
          deferred.resolve(true);
        }, function(result) {
          deferred.reject(result);
        });
        return deferred.promise;
      },

      exec: function() {
        var deferred = $q.defer();
        self.sendAll().then(function() {
          self.receiveAll().then(function() {
            deferred.resolve(true);
          });
        });
        return deferred.promise;
      }
    };
    return self;
  };

  return sync;
}]);