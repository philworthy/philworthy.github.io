

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
function LayoutCtrl($scope, $location, $window) {
	for ( i in TrelloScheduleModules ) {
		var mod = TrelloScheduleModules[i];
		mod.selected = (mod.uri == $location.path() ? 'selected' : '');
	}

	$scope.model = {
		modules: TrelloScheduleModules,
		version: TrelloScheduleVersion,
		ready: true
	};
}

/*----------------------------------------------------------------------------------------------------*/
function HomeCtrl() {}

/*----------------------------------------------------------------------------------------------------*/
function OverviewCtrl($scope, TrelloDataService) {
	TrelloDataService.loadData($scope, 'members/me', { organizations: 'all', boards: 'open' });
	$scope.model = TrelloDataService.model();
	$scope.model.ready = false;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
function CardTableCtrl($scope, $routeParams, CardTableService, TrelloDataService) {
	if ( !$routeParams.boardId ) {
		$scope.model = { ready: true };
		return;
	}

	CardTableService.loadBoardData(TrelloDataService, $scope, $routeParams);
	$scope.model = TrelloDataService.model();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
function ListCardTableCtrl($scope, $routeParams, ListCardTableService, TrelloDataService) {
	ListCardTableService.loadBoardData(TrelloDataService, $scope, $routeParams);
	$scope.model = TrelloDataService.model();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
function BoardCtrl($scope, $routeParams, BoardService, TrelloDataService) {
	BoardService.loadData(TrelloDataService, $scope, $routeParams);
	$scope.model = TrelloDataService.model();
}