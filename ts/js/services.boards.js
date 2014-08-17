

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
			{cmd: 'boards/53cc8a212249440d4b1dcede', ds: params, propName: 'bugs'},
			{cmd: 'boards/53d6d8d08fae1976ba265b31', ds: params, propName: 'flash player'},
			{cmd: 'boards/53cff888a3cc3fa2f1f5540f', ds: params, propName: 'html player'},
			{cmd: 'boards/53caddba45ffa359beb1cf9a', ds: params, propName: 'mobile'},
			{cmd: 'boards/4fe9828c6b88d0c66f40ac32', ds: params, propName: 'node api'},
			{cmd: 'boards/53847c6e402857b8fda7c759', ds: params, propName: 'web'},
			{cmd: 'boards/50065e1b7ade9ac46152a395', ds: params, propName: 'workflow'}
		];

		TrelloDataService.loadMultiData(scope, requests, function(scope) {
			//parseBoard(scope);

			var test = scope;

			if ( afterBuildCardTable ) {
				afterBuildCardTable(scope);
			}
		});

		scope.model = TrelloDataService.model();
		scope.model.ready = false;
		scope.model.table = null;

		scope.search = {};

		if ( routeParams.fl ) {
			scope.search.list = routeParams.fl;
		}

		scope.sortProp = null;
		scope.sortRev = false;

		scope.onFilter = function(search) {
			return function(item) {
				if ( search.name ) {
					if ( !isTextMatch(item.name, search.name) ) {
						return false;
					}
				}

				if ( search.list ) {
					if ( !isTextMatch(item.listName, search.list) ) {
						return false;
					}
				}

				return true;
			};
		};
		
		scope.onSort = function(sortProp) {
			if ( scope.sortProp == sortProp ) {
				if ( scope.sortRev ) {
					scope.sortProp = null;
					scope.sortRev = false;
					return;
				}

				scope.sortRev = true;
				return;
			}

			scope.sortProp = sortProp;
			scope.sortRev = false;
		};

		scope.descToHtml = function(desc, tagClass) {
			if ( desc == null ) {
				return null;
			}

			return descToHtml(desc, scope.model.table.board.id, tagClass);
		};
	};

	return svc;
});

