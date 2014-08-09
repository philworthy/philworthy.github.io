

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
	TrelloDataService.loadData($scope, 'boards/aMcxknJ7/cards', {  });
	$scope.model = TrelloDataService.model();
	$scope.model.ready = false;
}]);