

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloVisionApp.factory('BoardService', function() {

	var svc = {};

	svc.loadData = function(TrelloDataService, scope, routeParams, afterBuildCardTable) {

		var params = {
			lists: 'open',
			cards: 'visible',
			card_checklists: 'all',
			members: 'all',
			organization: 'true',
			actions: 'createCard,moveCardToBoard,updateCard:idList,moveCardFromBoard'
		};

		TrelloDataService.loadData(scope, 'boards/'+routeParams.boardId, params, function(scope) {
			
			var data = scope.model.data;

			var maps = {
				lists: {},
				members: {},
				cards: {}
			}

			// build map of lists
			for(var _l in data.lists) {
				var list = data.lists[_l];
				maps.lists[list.id] = list;
			}

			// build map of members
			for(var _m in data.members) {
				var member = data.members[_m];
				maps.members[member.id] = member;
			}

			// for each card
			for(var _c in data.cards) {
				var card = data.cards[_c];
				maps.cards[card.id] = card;
				card.list = maps.lists[card.idList];
				card.actions = [];
				card.dueDate = (card.due ? moment(card.due).format('MMM D') : null);

				// add members
				card.members = [];
				for(var _m in card.idMembers) {
					var idMember = card.idMembers[_m];
					card.members.push(maps.members[idMember]);
				}

				// add schedule
				card.schedule = [];
				for(var _cl in card.checklists) {
					var checklist = card.checklists[_cl];
					if(checklist.name.toLowerCase()=="schedule") {
						for(var _ci in checklist.checkItems) {
							var checkItem = checklist.checkItems[_ci];
							var substrings = checkItem.name.split(":");
							if(substrings.length==2) {
								var year = moment().year();
								var date = moment(substrings[1]);
								date.year(year);
								card.schedule.push({
									name: substrings[0],
									date: date,
									nameDate: substrings[0] + ': ' + date.format('MMM D')
								});
							}
						}
					}
				}
			}

			// add actions to cards
			for(var _a in data.actions) {
				var action = data.actions[_a];
				var card = maps.cards[action.data.card.id];
				if(card) card.actions.push(action);
			}

			// build timeline helper function
			var buildTimeRangeItem = function(cardId, previousAction, endDate) {
				var item = {
					type: 'range', 
					group: cardId, 
					start: moment(previousAction.date).toDate(),
					end: moment(endDate).toDate()
				}
				if(previousAction.type == "createCard") item.content = previousAction.data.list.name;
				else if(previousAction.type == "updateCard") item.content = previousAction.data.listAfter.name;
				else if(previousAction.type == "moveCardToBoard") item.content = previousAction.data.list.name; 
				else if(previousAction.type == "moveCardFromBoard") item.content = previousAction.data.boardTarget.name;
				return item;
			};

			// build timeline
			for(var _c in data.cards) {
				var card = data.cards[_c];
				card.timeline = [];

				card.timelineOptions = {
					width: 500,
					height: 30,
					showCurrentTime: true,
					showMinorlabels: false,
				    editable: false
				};

				// from actions
				card.actions.sort(function(a, b) { 
				    return moment(b.date).isBefore(a.date);
				});
				var previousAction = null;
				for(var _a=0; _a<card.actions.length; _a++) {
					var action = card.actions[_a];
					if(previousAction) card.timeline.push(buildTimeRangeItem(card.id, previousAction, action.date));
					previousAction = action;
				}
				if(previousAction) card.timeline.push(buildTimeRangeItem(card.id, previousAction, moment().toDate()));

				// from schedule
				for(var _s in card.schedule) {
					var s = card.schedule[_s];
					card.timeline.push({
						content: s.name,
						type: 'point', 
						group: card.id, 
						start: s.date.toDate()
					});
				}

				// from due date
				if(card.due) {
					card.timeline.push({
						content: 'Due',
						type: 'point', 
						group: card.id, 
						start: moment(card.due).toDate()
					});
				}
			}

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
