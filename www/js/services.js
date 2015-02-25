var List, Product;

angular.module('starter.services', [])

.run(function(DB) {
  DB.init();
})

.factory('DB', function($q, $window) {
    var self = {
      init: function() {
        persistence.store.websql.config(persistence, 'Lista', 'Lista de Compra', 5 * 1024 * 1024);        

        List = persistence.define('List', {
          name: 'TEXT',
          archived: 'BOOL'
        });

        Product = persistence.define('Product', {
          name: 'TEXT'
        });

        List.hasMany('products', Product, 'lists');
        Product.hasMany('lists', List, 'products');

        persistence.schemaSync(function(tx) {});
      }
    };

    return self;
})

.factory('List', ['$q', function($q) {  
  return {
    all: function() {
      var deferred = $q.defer();
      List.all().list(function (lists) {
        deferred.resolve(lists);
      });
      return deferred.promise;
    },

    get: function(id) {
      var deferred = $q.defer();
      List.load(id, function (list) {
        deferred.resolve(list);
      });
      return deferred.promise;
    },
    
    save: function(params) {
      var deferred = $q.defer();  
      if(params.id === undefined) {
        var list = new List(params);
        persistence.add(list);
        deferred.resolve(list);
      }
      else {
        persistence.flush(function() {
          deferred.resolve(params);
        });
      }
      return deferred.promise;
    },
    
    remove: function(list) {
      var deferred = $q.defer();
      persistence.remove(list);
      persistence.flush(function() {
        deferred.resolve(true);
      });
      return deferred.promise;
    }
  };
}])

.factory('Product', [function() {
  return Product;
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
