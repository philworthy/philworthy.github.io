

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloReportApp.factory('CardTableService', function() {
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

				if ( search.tag ) {
					if ( !isTextMatch(item.tags, search.tag) ) {
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

	for ( var ci in board.cards ) {
		var card = board.cards[ci];
		var c = {};
		table.cards.push(c);

		c.id = card.id;
		c.shortId = card.idShort;
		c.listId = card.idList;
		c.listName = table.listMap[card.idList].name;
		c.listNameFilter = cleanFilterText(c.listName);
		c.name = card.name;
		c.desc = card.desc;
		c.url = card.url;
		c.updatedRaw = card.dateLastActivity;
		c.updated = moment(card.dateLastActivity).format('MMM D');
		c.dueRaw = card.due;
		c.due = (card.due == null ? null : moment(card.due).format('MMM D'));
		c.memberCount = card.idMembers.length;
		c.commentCount = card.badges.comments;
		c.voteCount = card.badges.votes;
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

		var match;

		while ( (match = HashTagPattern.exec(c.desc)) ) {
			c.tags += '#'+match[3]+' ';
			c.tagCount++;
		}
	}
}