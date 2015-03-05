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
  function modelFactory(name, extras) {     
    var Entity = $db.model(name);
    var defaults = {
      all: function() {
        var deferred = $q.defer();
        Entity.all().list(function(list) {
          var all = [];
          angular.forEach(list, function(item) {
            all.push(new Model(item));
          }, all);
          deferred.resolve(all);
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
        var filter = Entity.all().filter(params[0], params[1], params[2]);

        if(params[3] !== undefined) {
          filter = filter.order(params[3]);
        }

        filter.list(function(list) {
          console.log(list)
          var all = [];
          angular.forEach(list, function(item) {
            all.push(new Model(item));
          }, all);      
          deferred.resolve(all);
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
        deferred.resolve(new Model(instance));
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