

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

			initTimeline(scope.model);
			parseBoard(scope.model, scope.model.data);

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
function initTimeline(model) {

	model.timeline = {
		data: [],
		groups: [],
		options: {
			showCurrentTime: true,
			showMajorlabels: true,
			showMinorlabels: true,
		    editable: false,
		    stack: false,
		    zoomable: false,
		    groupOrder: 'order',
		    autoResize: false,
		    orientation: 'top',
		    padding: 2,
		    zoomMin: 1209600000,
		    zoomMax: 7884000000,
		    start: moment().toDate()
		}
	};
}

function parseBoard(model, data) {

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

		card.schedule = {
			dates: [],
			durations: {},
			dependencies: []
		};
		for(var _cl in card.checklists) {
			var checklist = card.checklists[_cl];
			if(checklist.name.toLowerCase()=="schedule") {
				for(var _ci in checklist.checkItems) {
					var checkItem = checklist.checkItems[_ci];
					var substrings = checkItem.name.split(":");
					if(substrings.length!=2) continue;
					var str0 = substrings[0].toLowerCase();
					var str1 = substrings[1].replace(/\s+/,"");
					var date = chrono.parse(str1);
					if(date) {
						var item = {
							name: substrings[0],
							type: 'date',
							state: getItemState(substrings[0]),
							date: moment(date),
							nameDate: substrings[0] + ': ' + moment(date).format('MMM D')
						};
						card.schedule.dates.push(item);
					} else {
						var duration = juration.parse(str1);
						var item = {
							name: substrings[0],
							type: 'duration',
							state: getItemState(substrings[0]),
							date: moment.duration(duration,'s'),
							nameDate: substrings[0] + ': ' + date.humanize()
						};
						card.schedule.durations[item.name] = item;
					}


					/*if (str0.match(/^(.*est.*|.*dur.*|.*effort.*)$/)) {
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
						card.schedule.durations[item.name] = item;
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
						card.schedule.dates.push(item);
					}*/
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

		if(card.state=='inactive' || card.state=='done') continue; // do not show inactive cards

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

		buildTimelineGroup(card, model.timeline.groups);
		buldTimelineFromActions(card, model.timeline.data);
		buildTimelineFromSchedule(card, model.timeline.data, ['duration'], false, 'point');
		buildTimelineFromDue(card, model.timeline.data);
	}
}


/*----------------------------------------------------------------------------------------------------*/
function buildTimelineGroup(card, timelineGroups) {
	var groupDisplayName = (card.name.length>30) ? card.name.substring(0,30)+".." : card.name;
	timelineGroups.push({
		id: card.id,
		content: '<a href="'+card.url+'" target="_blank">'+groupDisplayName+'</a>',
		title: card.name,
		order: getStateOrder(card.state) + "-" + card.due
	});
}
/*----------------------------------------------------------------------------------------------------*/
function buldTimelineFromActions(card, timelineData) {
	card.actions.sort(function(a, b) { 
	    return moment(b.date).isBefore(a.date);
	});
	var previousAction = null;
	for(var _a=0; _a<card.actions.length; _a++) {
		var action = card.actions[_a];
		if(previousAction) {
			var timeRangeItem = buildTimeRangeItem(card.id, previousAction, action.date);
			timelineData.push(timeRangeItem);
		}
		previousAction = action;
	}
	if(previousAction) {
		var timeRangeItem = buildTimeRangeItem(card.id, previousAction, moment().toDate());
		timelineData.push(timeRangeItem);
	}
}
/*----------------------------------------------------------------------------------------------------*/
function buildTimelineFromSchedule(card, timelineData, filters, filterTypeAllow, type) {
	for(var _s in card.schedule.dates) {
		var s = card.schedule.dates[_s];
		var ignore = filterTypeAllow;
		for(_f in filters) {
			if(s.type == filters[_f]) {
				!ignore;
				break;
			}
		}
		if(ignore) continue;
		var timelineItem = {
			state: setStateType(s.name), 
			content: s.name,
			type: type, 
			group: card.id, 
			start: s.date.startOf('day').toDate()
		};
		timelineData.push(timelineItem);
	}
}
/*----------------------------------------------------------------------------------------------------*/
function buildTimelineFromDue(card, timelineData) {
	if(card.due) {
		var timelineItem = {
			state: 'done',
			content: 'Due',
			type: 'point', 
			group: card.id, 
			start: moment(card.due).startOf('day').toDate()
		};
		timelineData.push(timelineItem);
	}
}
/*----------------------------------------------------------------------------------------------------*/
function setStateType(_s) {
	var str = _s.toLowerCase();
	if (str.match(/^(.*in[ -]?box.*|.*backlog.*|.*discussion.*|.*moth.*|.*ice.*|.*frozen.*)$/)) return "inactive"
	else if (str.match(/^(.*prioritised.*|.*prioritized.*|.*ready.*|.*to[ -]?do.*|.*ready.*|.*waiting.*|.*pending.*|.*blocked.*)$/)) return "waiting"
	else if (str.match(/^(.*doing.*|.*progress.*|.*development.*)$/)) return "doing"
	else if (str.match(/^(.*qa.*|.*test.*|.*review.*)$/)) return "testing"
	else if (str.match(/^(.*done.*|.*release.*|.*ship.*|.*roll.*)$/)) return "done"
	return "inactive";
}
function getStateOrder(_s) {
	if(_s=='inactive') return 4
	else if(_s=='waiting') return 3
	else if(_s=='doing') return 2
	else if(_s=='testing') return 1
	else if(_s=='done') return 0
	else return 0;
}
function buildTimeRangeItem(cardId, previousAction, endDate) {
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
