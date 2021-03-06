

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloScheduleApp.factory('ListCardTableService', function() {

	var svc = {};

	svc.loadBoardData = function(TrelloDataService, scope, routeParams, afterBuildCardTable) {

		var lists = [
			// Bugs
			"53dbd8ceea98842ab014477f",
			"53de515f00d9cf841328bb27",
			// Workflow
			"52540c6068d4feb45200c88a",
			"53e33898956cc9437376b593",
			// Web
			"53847c6e402857b8fda7c75c",
			"53d23c0bc8fd0a464b34ba91",
			// HTML PLayer
			"53cff888a3cc3fa2f1f55412",
			"53def3e720f3d69469307eeb",
			// Flash Player
			"53d6d8d08fae1976ba265b34",
			"53e37f8c82b9163a73699e91",
			// Node API
			"53c92e8da8dfc5f54adbd950",
			"53e37d06f2ef915cb1407bbd"
		];

		var urls = [];
		for(li in lists) {
			l = lists[li];
			urls.push("/lists/"+l+"/cards?checklists=all&checkItemStates=true&members=true&actions=updateCard:idList&list=true");
		}

		var params = {
			/*lists: 'open',
			cards: 'visible',
			card_checklists: 'all',
			members: 'all',
			organization: 'true'*/
			//actions: 'updateCard:idList',
			//checklists: 'all',
			//members: 'true',
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

		scope.onTimeLineCallback = function(params) {
			$window.alert( angular.toJson(params) );
		};
	};

	return svc;
});


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
function buildListCardTable(scope) {

	var data = scope.model.data;

	var timeLineOptions = {
		width: '100%',
		height: 200,
		showCurrentTime: true,
		showMinorlabels: false,
		groupOrder: 'content',
	    editable: true
	};

	var table = {
		cards: [],
		listIds: [],
		listMap: {},
		timeData: [{content: 'Now', start: moment(), type: 'point'}],
		timeOptions: timeLineOptions,
		timeGroups: [],
		timeGroupsMap: {}
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
			c.id = card.id
			c.url = card.url;
			c.listName = "List";
			c.dueRaw = card.due;
			c.due = (card.due == null ? null : moment(card.due).format('MMM D'));
			c.schedule = [];

			if(!table.timeGroupsMap[c.id]) {
				var group = {id: c.id, content: c.name};
				table.timeGroups.push(group);
				table.timeGroupsMap[c.id] = group;
			}

			if(card.due != null) {
				table.timeData.push({type: 'point', group: c.id, content: card.name, start: moment(card.due).toDate()});
			}

			for(li in card.checklists) {
				var list = card.checklists[li];
				if(list.name=="Schedule") {
					for(lci in list.checkItems) {
						var lc = list.checkItems[lci];
						var substrings = lc.name.split(":");
						if(substrings.length==2) {
							var year = moment().year();
							var date = moment(substrings[1]);
							date.year(year);
							table.timeData.push({type: 'point', group: c.id, content: substrings[0], start: date.toDate()});
						}
						c.schedule.push(lc.name);
					}
				}
			}
		}
	}	
}

