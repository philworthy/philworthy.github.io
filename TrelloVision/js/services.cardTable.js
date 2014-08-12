

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloVisionApp.factory('CardTableService', function() {

	var svc = {};

	svc.loadBoardData = function(TrelloDataService, scope, routeParams, afterBuildCardTable) {
		var params = {
			lists: 'open',
			cards: 'visible',
			card_checklists: 'all',
			members: 'all',
			organization: 'true'
		};

		TrelloDataService.loadData(scope, 'boards/'+routeParams.boardId, params, function(scope) {
			buildCardTable(scope);

			if ( afterBuildCardTable ) {
				afterBuildCardTable(scope);
			}
		});

		scope.model = TrelloDataService.model();
		scope.model.ready = false;
		scope.model.table = null;
		scope.model.csv = null;

		scope.search = {};

		if ( routeParams.ft ) {
			scope.search.tag = routeParams.ft;
		}

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


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
function buildCardTable(scope) {

	var board = scope.model.data;

	var table = {
		board: board,
		org: board.organization,
		members: board.members,
		labelColors: ['green', 'yellow', 'orange', 'red', 'purple', 'blue'],
		labelMap: board.labelNames,
		listIds: [],
		listMap: {},
		cards: []
	};

	scope.model.table = table;

	for ( var li in board.lists ) {
		var list = board.lists[li];
		table.listIds.push(list.id);
		table.listMap[list.id] = list;
	}

	for(var ci in cards) {
		var card = cards[ci];
		var c = {};
		table.cards.push(c);

		c.name = card.name;
		c.url = card.url;
		c.listId = card.idList;
		c.listName = table.listMap[card.idList].name;
		c.listNameFilter = cleanFilterText(c.listName);
		c.dueRaw = card.due;
		c.due = (card.due == null ? null : moment(card.due).format('MMM D'));
		c.schedule = [];

		for(li in card.checklists) {
			var list = card.checklists[li];
			if(list.name=="Schedule") {
				for(lci in list.checkItems) {
					var lc = list.checkItems[lci];
					c.schedule.push(lc.name);
				}
			}
		}
	}
}

