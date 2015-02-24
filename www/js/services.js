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
        self.db = $window.sqlitePlugin.openDatabase({name: "lista_compra"});

        self.db.transaction(function(tx) {
            // tx.executeSql('DROP TABLE IF EXISTS cards');
          tx.executeSql('CREATE TABLE IF NOT EXISTS lists (id integer primary key, name varchar(20), archived boolean);');
          tx.executeSql('CREATE TABLE IF NOT EXISTS products (id integer primary key, name varchar(20));');
        }, function(e) {
          console.error(e);
        }); 
      }
    };

    return self;
})

.factory('$db', ['DB', function(DB) {  
  var defaults = {
    sqls: {
      all: 'SELECT * FROM %NAME%',
      get: 'SELECT * FROM %NAME% WHERE id = ?',
      add: 'INSERT INTO %NAME% (name) VALUES (?)',
      remove: 'DELETE FROM %NAME% WHERE id = ?'
    },

    parse: function(extended_sqls) {
      return angular.extend({}, defaults.sqls, extended_sqls);
    }
  };

  function replace_sql(sql, name) {
    return sql.replace('%NAME%', name);
  }

  var dbFactory = function(name, extended_sqls) {
    var sqls = defaults.parse(extended_sqls);

    var self = {
      all: function() {
        return DB.execute(replace_sql(sqls.all, name)).then(function(result) {
          return DB.fetchAll(result);
        });
      },

      get: function(id) {
        return DB.execute(replace_sql(defaults.sqls.get, name), [id]).then(function(result){ 
          return DB.fetch(result);
        });
      },

      add: function(list) {
        return DB.execute(replace_sql(sqls.add, name), [list.name]).then(function(result) {
          return result;
        });
      },

      remove: function(list) {
        return DB.execute(replace_sql(sqls.remove, name), [list.id]).then(function(result) {
          return result;
        });
      }
    };

    return self;
  };

  return dbFactory;
}])

.factory('Lists', ['$db', function($db) {
  return $db('lists');
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
