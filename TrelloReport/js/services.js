

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
var appServices = angular.module('appServices', ['ngResource']);


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
appServices.factory('TrelloDataService', function() {
	var svc = { };

	var model = {
		ready: false,
		data: null,
		error: null
	};

	svc.loadData = function(scope, apiCommand, dataSets, onDataSuccess) {
		var onGetSuccess = function(data) {
			model.data = data;
			model.ready = true;

			if ( onDataSuccess ) {
				onDataSuccess(scope);
			}

			scope.$apply();
		};

		var failCount = 0;

		var onGetError = function(err) {
			if ( ++failCount <= 3 && isTrelloAuthRequired(err) ) {
				trelloAuth(sendTrelloCmd, onAuthError);
				return;
			}

			model.error = 'Trello data access failed: '+err.responseText;
			scope.$apply();
		};

		var sendTrelloCmd = function() {
			Trello.get(apiCommand, dataSets, onGetSuccess, onGetError);
		};

		var onAuthError = function() {
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
/*----------------------------------------------------------------------------------------------------*/
function trelloAuth(onSuccess, onError) {
	var opt = {
		type: "popup",
		name: "TrelloReport",
		scope: { read: true },
		success: onSuccess,
		error: onError
	};

	Trello.authorize(opt);
}

/*----------------------------------------------------------------------------------------------------*/
function isTrelloAuthRequired(err) {
	return (err.responseText.indexOf('invalid token') == 0);
}

