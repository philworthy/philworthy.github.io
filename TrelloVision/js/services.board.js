

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloVisionApp.factory('BoardService', function() {

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

			// build helper functions
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
			var buildProgressBarItem = function(timeRangeItem, startEndRange) {
				var item = {
					type: 'warning', 
					value: (timeRangeItem.end-timeRangeItem.start)/startEndRange*100,
					name: timeRangeItem.content
				}
				var str = timeRangeItem.content.toLowerCase();
				if (str.match(/^(in[ -]?box|backlog|discussion|moth|ice)$/)) item.type = "info"
				else if (str.match(/^(prioritised|prioritized|ready|to[ -]?do)$/)) item.type = null
				else if (str.match(/^(doing|progress|development)$/)) item.type = "success"
				else if (str.match(/^(ready|waiting|pending|blocked)$/)) item.type = "warning"
				else if (str.match(/^(qa|test|review)$/)) item.type = "danger"
				else if (str.match(/^(release|ship|roll)$/)) item.type = "info"
				return item;
			};

			// build timeline and progress bar
			for(var _c in data.cards) {
				var card = data.cards[_c];
				card.timeline = [];

				card.timelineOptions = {
					width: 500,
					height: 100,
					showCurrentTime: true,
					showMinorlabels: false,
				    editable: false,
				    stack: false,
				    zoomable: false
				};

				// from actions
				card.actions.sort(function(a, b) { 
				    return moment(b.date).isBefore(a.date);
				});
				var previousAction = null;
				for(var _a=0; _a<card.actions.length; _a++) {
					var action = card.actions[_a];
					if(previousAction) {
						var timeRangeItem = buildTimeRangeItem(card.id, previousAction, action.date);
						card.timeline.push(timeRangeItem);
					}
					previousAction = action;
				}
				if(previousAction) {
					var timeRangeItem = buildTimeRangeItem(card.id, previousAction, moment().toDate());
					card.timeline.push(timeRangeItem);
				}

				// build progressBar
				card.progressBar = [];
				var progressBarMin = null;
				var progressBarMax = null;
				for(var _t in card.timeline) {
					var item = card.timeline[_t];
					if(!progressBarMin) progressBarMin = item.start;
					else if(item.start < progressBarMin) progressBarMin = item.start;
					if(!progressBarMax) progressBarMax = item.end;
					else if(item.end > progressBarMax) progressBarMax = item.end;
				}
				var startEndRange = progressBarMax - progressBarMin;
				for(var _t in card.timeline) {
					var item = card.timeline[_t];
					card.progressBar.push(buildProgressBarItem(item, startEndRange));
				}

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
