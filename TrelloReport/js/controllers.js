

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
var appControllers = angular.module('appControllers', []);


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
appControllers.controller('BoardsController', ['$scope', 'TrelloDataService', function($scope, TrelloDataService) {
	TrelloDataService.loadData($scope, 'members/me', { organizations: 'all', boards: 'open' });
	$scope.model = TrelloDataService.model();
	$scope.model.ready = false;
}]);

appControllers.controller('QACardsController', ['$scope', 'TrelloDataService', function($scope, TrelloDataService) {
	TrelloDataService.loadData($scope, 'boards/4fe9828c6b88d0c66f40ac32/cards', {  });
	$scope.model = TrelloDataService.model();
	$scope.model.ready = false;
}]);