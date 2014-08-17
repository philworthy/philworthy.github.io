

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloScheduleApp.factory('BoardsService', function() {

	var svc = {};

	svc.loadData = function(TrelloDataService, scope, routeParams, afterBuildCardTable) {

		var params = {
			lists: 'open',
			list_fields: 'name',
			cards: 'visible',
			card_checklists: 'all',
			members: 'all',
			member_fields: 'fullName,initials,avatarHash',
			organization: 'true',
			actions: 'createCard,moveCardToBoard,updateCard:idList,moveCardFromBoard',
			actions_limit: 1000,
			action_member: false,
			action_memberCreator: false
		};

		var requests = [
			{apiCommand: 'boards/53cc8a212249440d4b1dcede', dataSets: params, propertyName: 'bugs'},
			{apiCommand: 'boards/53d6d8d08fae1976ba265b31', dataSets: params, propertyName: 'flash player'},
			{apiCommand: 'boards/53cff888a3cc3fa2f1f5540f', dataSets: params, propertyName: 'html player'},
			{apiCommand: 'boards/53caddba45ffa359beb1cf9a', dataSets: params, propertyName: 'mobile'},
			{apiCommand: 'boards/4fe9828c6b88d0c66f40ac32', dataSets: params, propertyName: 'node api'},
			{apiCommand: 'boards/53847c6e402857b8fda7c759', dataSets: params, propertyName: 'web'},
			{apiCommand: 'boards/50065e1b7ade9ac46152a395', dataSets: params, propertyName: 'workflow'}
		];

		TrelloDataService.loadMultiData(scope, requests, function(scope) {

			initTimeline(scope.model);
			for(request in requests) {
				var response = scope.model[requests[request].propertyName];
				if(response) {
					parseBoard(scope.model, response)
				};
			}

			if ( afterBuildCardTable ) {
				afterBuildCardTable(scope);
			}
		});
	};

	return svc;
});

