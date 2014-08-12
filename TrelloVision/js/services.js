
var TrelloVisionApp = angular
	.module('TrelloVision', [])
	.config(['$routeProvider', buildRoutes]);

var TrelloVisionModules = [
	{ name: 'Overview', uri: '/overview' },
	{ name: 'Cards', uri: '/cardtable' },
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
		.otherwise({
			redirectTo: '/'
		});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloVisionApp.factory('TrelloDataService', function() {
	var svc = { };

	var model = {
		ready: false,
		data: null,
		error: null
	};

	svc.loadData = function(scope, apiCommand, dataSets, onDataSuccess) {
		var onGetSuccess = function(data) {
			console.log("Trello success");
			model.data = data;
			model.ready = true;

			if ( onDataSuccess ) {
				console.log("data success");
				onDataSuccess(scope);
			}

			scope.$apply();
		};

		var failCount = 0;

		var onGetError = function(err) {
			console.log("Trello error");
			if ( ++failCount <= 3 && isTrelloAuthRequired(err) ) {
				trelloAuth(sendTrelloCmd, onAuthError);
				return;
			}

			model.error = 'Trello data access failed: '+err.responseText;
			scope.$apply();
		};

		var sendTrelloCmd = function() {
			console.log("Trello send "+apiCommand);
			Trello.get(apiCommand, dataSets, onGetSuccess, onGetError);
		};

		var onAuthError = function() {
			console.log("Trello oAuth error");
			model.error = 'Trello authorization failed.';
			scope.$apply();
		};

		sendTrelloCmd();
	};

	svc.loadMultiData = function(scope, apiRequests, onDataSuccess) {
		model.count = apiRequests.length;

		for ( i in apiRequests ) {
			var cmd = apiRequests[i].apiCommand;
			var ds = apiRequests[i].dataSets;
			var propName = apiRequests[i].propertyName;

			var makeOnSuccess = function(prop) {
				return function(data) {
					model[prop] = data;

					if ( --model.count == 0 ) {
						model.ready = true;
						onDataSuccess(scope);
						scope.$apply();
					}
				};
			};

			Trello.get(cmd, ds, makeOnSuccess(propName));
		}
	};

	svc.model = function() {
		return model;
	};

	return svc;
});