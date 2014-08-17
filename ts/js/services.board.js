

////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
TrelloScheduleApp.factory('BoardService', function() {

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

			var timeline = [];
			var timelineGroups = [];
			scope.model.timeline = {
				data: timeline,
				groups: timelineGroups,
				options: {
					width: '100%',
					showCurrentTime: true,
					showMajorlabels: true,
					showMinorlabels: true,
				    editable: false,
				    stack: false,
				    zoomable: true,
				    groupOrder: 'order',
				    autoResize: false,
				    orientation: 'top',
				    padding: 2,
				    zoomMin: 1209600000,
				    zoomMax: 7884000000,
				    start: moment().toDate()
				}
			};

			var maps = {
				lists: {},
				members: {},
				cards: {},
				timelineGroups: {}
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
				card.descHtml = descToHtml(card.desc);
				card.list = maps.lists[card.idList];
				card.state = setStateType(card.list.name);
				card.actions = [];
				card.dueDate = (card.due ? moment(card.due).format('MMM D') : null);

				// add members
				card.members = [];
				for(var _m in card.idMembers) {
					var idMember = card.idMembers[_m];
					card.members.push(maps.members[idMember]);
				}

				// add (parse) schedule and durations
				var getItemState = function(_s) {
					var str = _s.toLowerCase();
					if (str.match(/^(.*doing.*|.*progress.*|.*development.*)$/)) return "doing"
					else if (str.match(/^(.*qa.*|.*test.*|.*review.*)$/)) return "testing"
					return null;
				}
				card.schedule = [];
				for(var _cl in card.checklists) {
					var checklist = card.checklists[_cl];
					if(checklist.name.toLowerCase()=="schedule") {
						for(var _ci in checklist.checkItems) {
							var checkItem = checklist.checkItems[_ci];
							var substrings = checkItem.name.split(":");
							if(substrings.length!=2) continue;
							var str0 = substrings[0].toLowerCase();
							if (str0.match(/^(.*est.*|.*dur.*|.*effort.*)$/)) {
								var str1 = substrings[1].replace(/\s+/,"");
								var str1 = str1.match(/^(\d+)(\w+)$/);
								if(!str1 || str1.length!=3) continue;
								var date = moment.duration(parseFloat(str1[1]),str1[2]);
								var item = {
									name: substrings[0],
									type: 'duration',
									state: getItemState(substrings[0]),
									date: date,
									nameDate: substrings[0] + ': ' + date.humanize()
								};
								card.schedule.push(item);
							} else {
								var year = moment().year();
								var date = moment(substrings[1]);
								date.year(year);
								var item = {
									name: substrings[0],
									type: 'date',
									state: getItemState(substrings[0]),
									date: date,
									nameDate: substrings[0] + ': ' + date.format('MMM D')
								};
								card.schedule.push(item);
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

				// build timeline group for card
				timelineGroups.push({
					id: card.id,
					content: getStateOrder(card.state) + "-" + card.state + ": " + card.name.substring(0,30) + '..',
					content: '<a href="{{'+card.url+'}}" target="_blank">{{'+(card.name.length>30?:card.name.substring(0,30)+"…":card.name)+'}}</a>',
					title: card.name,
					order: getStateOrder(card.state) + "-" + card.due
				});

				// build timeline from actions
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
					item.className = setStateType(item.content);
					item.duration = moment.duration((item.end-item.start), "milliseconds").humanize();
					item.calendar = moment(previousAction.date).calendar();
					return item;
				};
				card.actions.sort(function(a, b) { 
				    return moment(b.date).isBefore(a.date);
				});
				var previousAction = null;
				for(var _a=0; _a<card.actions.length; _a++) {
					var action = card.actions[_a];
					if(previousAction) {
						var timeRangeItem = buildTimeRangeItem(card.id, previousAction, action.date);
						card.timeline.push(timeRangeItem);
						timeline.push(timeRangeItem);
					}
					previousAction = action;
				}
				if(previousAction) {
					var timeRangeItem = buildTimeRangeItem(card.id, previousAction, moment().toDate());
					card.timeline.push(timeRangeItem);
					timeline.push(timeRangeItem);
				}

				// build progressBar from actions
				// var buildProgressBarItem = function(timeRangeItem, startEndRange) {
				// 	var duration = timeRangeItem.end-timeRangeItem.start;
				// 	var item = {
				// 		state: setStateType(timeRangeItem.content), 
				// 		value: duration/startEndRange*100,
				// 		duration: moment.duration(duration, "milliseconds").humanize(),
				// 		name: timeRangeItem.content
				// 	}
				// 	return item;
				// };
				// card.progressBar = [];
				// var progressBarMin = null;
				// var progressBarMax = null;
				// for(var _t in card.timeline) {
				// 	var item = card.timeline[_t];
				// 	if(!progressBarMin) progressBarMin = item.start;
				// 	else if(item.start < progressBarMin) progressBarMin = item.start;
				// 	if(!progressBarMax) progressBarMax = item.end;
				// 	else if(item.end > progressBarMax) progressBarMax = item.end;
				// }
				// var startEndRange = progressBarMax - progressBarMin;
				// for(var _t in card.timeline) {
				// 	var item = card.timeline[_t];
				// 	card.progressBar.push(buildProgressBarItem(item, startEndRange));
				// }

				// build timeline from schedule
				for(var _s in card.schedule) {
					var s = card.schedule[_s];
					if(s.type == 'duration') continue;
					var timelineItem = {
						state: setStateType(s.name), 
						content: s.name,
						type: 'point', 
						group: card.id, 
						start: s.date.startOf('day').toDate()
					};
					card.timeline.push(timelineItem);
					timeline.push(timelineItem);
				}

				// build timeline from due date
				if(card.due) {
					var timelineItem = {
						state: 'done',
						content: 'Due',
						type: 'point', 
						group: card.id, 
						start: moment(card.due).startOf('day').toDate()
					};
					card.timeline.push(timelineItem);
					timeline.push(timelineItem);
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


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*----------------------------------------------------------------------------------------------------*/
var setStateType = function(_s) {
	var str = _s.toLowerCase();
	if (str.match(/^(.*in[ -]?box.*|.*backlog.*|.*discussion.*|.*moth.*|.*ice.*|.*frozen.*)$/)) return "inactive"
	else if (str.match(/^(.*prioritised.*|.*prioritized.*|.*ready.*|.*to[ -]?do.*|.*ready.*|.*waiting.*|.*pending.*|.*blocked.*)$/)) return "waiting"
	else if (str.match(/^(.*doing.*|.*progress.*|.*development.*)$/)) return "doing"
	else if (str.match(/^(.*qa.*|.*test.*|.*review.*)$/)) return "testing"
	else if (str.match(/^(.*done.*|.*release.*|.*ship.*|.*roll.*)$/)) return "done"
	return "inactive";
}
var getStateOrder = function(_s) {
	if(_s=='inactive') return 4
	else if(_s=='waiting') return 3
	else if(_s=='doing') return 2
	else if(_s=='testing') return 1
	else if(_s=='done') return 0
	else return 0;
}
