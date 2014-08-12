

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloVisionApp.factory('ListCardTableService', function() {

	var svc = {};

	svc.loadBoardData = function(TrelloDataService, scope, routeParams, afterBuildCardTable) {

		var urls = [
			"/lists/53c92e8da8dfc5f54adbd950/cards?checklists=all&checkItemStates=true&members=true&actions=updateCard:idList&list=true", // API: Ready for QA
			"/lists/53e37d06f2ef915cb1407bbd/cards?checklists=all&checkItemStates=true&members=true&actions=updateCard:idList&list=true", // API: In QA
			"/lists/53e37d16740abf207bc80d1e/cards?checklists=all&checkItemStates=true&members=true&actions=updateCard:idList&list=true" // API: Ready for Release
		];

		var params = {
			/*lists: 'open',
			cards: 'visible',
			card_checklists: 'all',
			members: 'all',
			organization: 'true'*/
			//actions: 'updateCard:idList',
			checklists: 'all',
			members: 'true',
			urls: urls.toString()
		};

		TrelloDataService.loadData(scope, 'batch', params, function(scope) {
			buildListCardTable(scope);

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
function buildListCardTable(scope) {

	var data = scope.model.data;

	var table = {
		cards: [],
		listIds: [],
		listMap: {}
	};

	scope.model.table = table;

	for(var ai in data) {
		var a = data[ai];
		if(!a['200']) continue;
		var cards = a['200'];

		for(var ci in cards) {
			var card = cards[ci];
			var c = {};
			table.cards.push(c);

			c.name = card.name;
			c.url = card.url;
			c.listName = "List";
			c.dueRaw = card.due;
			c.due = (card.due == null ? null : moment(card.due).format('MMM D'));
			c.schedule = ""

			for(li in card.checklists) {
				var list = card.checklists[li];
				if(list.name=="Schedule") {
					var schedule = [];
					for(lci in list.checkItems) {
						var lc = list.checkItems[lci];
						schedule.push(lc.name);
					}
					c.schedule = schedule.toString();
				}
			}
		}
	}
}

