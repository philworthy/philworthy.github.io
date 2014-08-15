
var TrelloVisionApp = angular
	.module('TrelloVision', ['ngRoute', 'ngResource', 'ui.bootstrap', 'angular.vistimeline'])
	.config(['$routeProvider', buildRoutes]);

var TrelloVisionModules = [
	{ name: 'Overview', uri: '/overview' },
	{ name: 'QA Cards', uri: '/listcardtable' }
];


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
function buildRoutes($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'views/home.html',
			controller: HomeCtrl
		})
		.when('/overview', {
			templateUrl: 'views/overview.html',
			controller: OverviewCtrl
		})
		.when('/cardtable', {
			templateUrl: 'views/cardtable.html',
			controller: CardTableCtrl
		})
		.when('/cardtable/board', {
			templateUrl: 'views/cardtable.html',
			controller: CardTableCtrl
		})
		.when('/cardtable/board/:boardId', {
			templateUrl: 'views/cardtable-board.html',
			controller: CardTableCtrl
		})
		.when('/listcardtable', {
			templateUrl: 'views/cardtable-list.html',
			controller: ListCardTableCtrl
		})
		.when('/board', {
			templateUrl: 'views/overview.html',
			controller: OverviewCtrl
		})
		.when('/board/:boardId', {
			templateUrl: 'views/board.html',
			controller: BoardCtrl
		})
		.when('/board/timeline/:boardId', {
			templateUrl: 'views/board-timeline.html',
			controller: BoardCtrl
		})
		.otherwise({
			redirectTo: '/'
		});
}