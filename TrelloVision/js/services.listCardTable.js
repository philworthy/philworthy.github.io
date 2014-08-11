

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloVisionApp.factory('ListCardTableService', function() {

	var svc = {};

	svc.loadBoardData = function(TrelloDataService, scope, routeParams, afterBuildCardTable) {

		var urls = [
			"/lists/53c92e8da8dfc5f54adbd950/cards?checklists=all", // API: Ready for QA
			"/lists/53e37d06f2ef915cb1407bbd/cards?checklists=all", // API: In QA
			"/lists/53e37d16740abf207bc80d1e/cards?checklists=all" // API: Ready for Release
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

	var cards = scope.model.data;

	var table = {
		cards: [],
		listIds: [],
		listMap: {}
	};

	scope.model.table = table;

	table.listIds.push('53c92e8da8dfc5f54adbd950');
	table.listMap['53c92e8da8dfc5f54adbd950'] = 'API: Ready for QA';
	table.listIds.push('53e37d06f2ef915cb1407bbd');
	table.listMap['53e37d06f2ef915cb1407bbd'] = 'API: In QA';
	table.listIds.push('53e37d16740abf207bc80d1e');
	table.listMap['53e37d16740abf207bc80d1e'] = 'API: Ready for Release';

	for ( var ci in cards ) {
		var card = cards[ci];
		var c = {};
		table.cards.push(c);

		c.id = card.id;
		c.shortId = card.idShort;
		c.listId = card.idList;
		c.listName = table.listMap[card.idList];
		//c.listNameFilter = cleanFilterText(c.listName);
		c.name = card.name;
		c.desc = card.desc;
		c.url = card.url;
		c.updatedRaw = card.dateLastActivity;
		c.updated = moment(card.dateLastActivity).format('MMM D');
		c.dueRaw = card.due;
		c.due = (card.due == null ? null : moment(card.due).format('MMM D'));
		//c.memberCount = card.idMembers.length;
		//c.commentCount = card.badges.comments;
		//c.voteCount = card.badges.votes;
		c.checklists = [];
		c.tags = '';
		c.tagCount = 0;

		for ( li in card.labels ) {
			var lbl = card.labels[li];
			c[lbl.color+'Label'] = lbl.name;
		}

		for ( li in card.checklists ) {
			var list = card.checklists[li];
			var comp = 0;

			for ( i in list.checkItems ) {
				if ( list.checkItems[i].state == 'complete' ) {
					++comp;
				}
			}

			c.checklists.push({
				name: list.name,
				progress: comp+'/'+list.checkItems.length
			});
		}

		for ( var mi in card.idMembers ) {
			var memId = card.idMembers[mi];
			c['member'+memId] = true;
		}
	}

}

