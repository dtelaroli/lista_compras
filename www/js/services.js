var List, Product;

angular.module('starter.services', ['webSqlWrapper'])

.run(function(DB) {
  DB.init();
})

.factory('DB', function($q, $window) {
    var self = {
      execute: function(query, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();
         
        self.db.transaction(function(transaction) {
          transaction.executeSql(query, bindings, function(transaction, result) {
            deferred.resolve(result);
          }, function(transaction, error) {
            deferred.reject(error);
          });
        });
       
        return deferred.promise;
      },

      fetchAll: function(result) {
        var output = [];       
        for (var i = 0; i < result.rows.length; i++) {
          output.push(result.rows.item(i));
        }
        return output;
      },

      fetch: function(result) {
        return result.rows.item(0);
      },
    
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

        // var list = new List({name: 'Foo'});
        // var product = new Product({name: 'Bar'});
        // list.products.add(product);

        // persistence.add(list);
        // persistence.transaction(function(tx) {
        //   persistence.flush(tx, function() {
        //     console.log('Done flushing!');
        //   });
        // });

        // self.db = $window.sqlitePlugin.openDatabase({name: "lista_compra"});

        // self.db.transaction(function(tx) {
        //   // tx.executeSql('DROP TABLE lists');
        //   tx.executeSql('CREATE TABLE IF NOT EXISTS lists (id integer primary key, name varchar(20), archived boolean);');
        //   tx.executeSql('CREATE TABLE IF NOT EXISTS products (id integer primary key, name varchar(20));');
        //   tx.executeSql('CREATE TABLE IF NOT EXISTS lists_products (list_id integer, product_id integer);');

        // }, function(e) {
        //   console.error(e);
        // }); 
      }
    };

    return self;
})

.factory('List', [function() {
  return List;
}])

.factory('Product', ['$db', function($db) {
  return $db('products');
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
