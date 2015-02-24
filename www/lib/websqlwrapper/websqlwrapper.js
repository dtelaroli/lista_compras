angular.module('webSqlWrapper', [])

.run(function($window) {
	if($window.sqlitePlugin == undefined) {
		if(!$window.openDatabase) {
			alert('WebSQL not supported');
			return;
		}

		$window.sqlitePlugin = {
			openDatabase: function(opts) {
				return $window.openDatabase(opts.name, '1.0', opts.name, 2 * 1024 * 1024);;
			}
		}; 	
  }
});
