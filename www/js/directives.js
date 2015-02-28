angular.module('starter.directives', [])

.filter('byLabel', function(name) {

})

.directive('autocomplete', ['$filter', '$compile', function($filter, $compile) {
	return {
		restrict: 'A',
		scope: {
			params: '=autocomplete',
			input: '=ngModel'
		},
		template: '<div class="item autocomplete" ng-repeat="item in params.items | filter:input" ng-click="selectItem(item)" ng-show="show">'
		+ '{{item.name}}'
		+ '</div>',
		link: function(scope, elm, attr) {
			scope.$watch('input', function(value) {
				if(value === undefined) {
					scope.show = false;
				}
				else {
					scope.show = value.length > 0;
				}
			});

			scope.selectItem = function (item) {
				elm.val(item.name);
				scope.show = false;
				scope.params.onSelect(item);
			};

			var template = $compile(elm.contents())(scope);
			elm.parent().parent().parent().append(template);
		}
	}
}]);