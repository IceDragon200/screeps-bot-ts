import * as _ from "lodash";
import Counters from "./counters";
import CartographyRepo from "./repo.cartography";
import IdleAction from "./action.idle";

namespace SurveyorRole {
	function resetPosition(creep: Creep) {
		creep.memory.hasntMoved = 0;
		return creep;
	}

	function trackPosition(creep: Creep) {
		const mem = creep.memory;
		if (!mem.hasntMoved) mem.hasntMoved = 0;
		if (mem.lastPosition) {
			if (mem.lastPosition.x === creep.pos.x &&
				mem.lastPosition.y === creep.pos.y &&
				mem.lastPosition.roomName === creep.pos.roomName) {
				mem.hasntMoved++;
			} else {
				resetPosition(creep);
			}
		}
		mem.lastPosition = _.clone(creep.pos);
	}

	function cancelQuest(creep: Creep) {
		if (creep.memory.survey.questId) {
			CartographyRepo.cancelQuestById(creep.memory.survey.questId);
			creep.memory.survey.questId = null;
		}
	}

	function moveToRoute(creep: Creep, route) {
		const target = <RoomObject>creep.pos.findClosestByRange(route);
		if (target) {
			const r = creep.moveTo(target);
			switch (r) {
				case OK:
					break;
				case ERR_BUSY:
					Counters.sleep(creep, 3);
					break;
				default:
					console.log(`Unhandled move ${r}`);
			}
		}
	}

	export function run(creep: Creep) {
		const survey = creep.memory.survey;
		switch (creep.memory.state) {
			case 'start.return.home':
				survey.exitRoute = Game.map.findRoute(creep.room, creep.memory.homeRoom);
				creep.say('rt home');
				creep.memory.state = 'return.home';
				break;
			case 'return.home':
				if (survey.exitRoute.length > 0) {
					let route = survey.exitRoute[0];
					if (creep.pos.roomName === route.room) {
						survey.exitRoute.shift();
						route = survey.exitRoute[0];
					}
					moveToRoute(creep, route);
				} else {
					creep.say('home');
					creep.memory.state = 'request.quest';
				}
				break;
			case 'request.quest':
				cancelQuest(creep);
				const quest = CartographyRepo.requestQuest(survey.questRoom);
				if (quest) {
					resetPosition(creep);
					CartographyRepo.acceptQuest(quest, creep);
					const cr = CartographyRepo.getRoomByName(quest.parentRoom);
					survey.questId = quest.id;
					survey.targetRoom = quest.targetRoom;
					survey.exitRoute = Game.map.findRoute(creep.room, survey.targetRoom);
					creep.say(`qs ${survey.targetRoom}`);
					Counters.work(creep);
					creep.memory.state = 'do.quest';
				} else {
					creep.say("no quest");
					IdleAction.run(creep);
					//Counters.sleep(creep, 3);
				}
				break;
			case 'do.quest':
				trackPosition(creep);

				if (survey.exitRoute && survey.exitRoute.length > 0) {
					const route = survey.exitRoute[0];
					//console.log(creep.pos.roomName, survey.targetRoom);
					if (creep.pos.roomName === route.room) {
						survey.exitRoute.shift();
						if (survey.exitRoute.length > 0) {
							creep.moveTo(survey.exitRoute[0]);
						}
					}

					if (creep.pos.roomName === survey.targetRoom) {
						console.log(`Entered room ${creep.room.name}`);
						switch (survey.exitDirection) {
							case FIND_EXIT_TOP:
								creep.moveTo(creep.pos.north());
								break;
							case FIND_EXIT_BOTTOM:
								creep.moveTo(creep.pos.south());
								break;
							case FIND_EXIT_LEFT:
								creep.moveTo(creep.pos.west());
								break;
							case FIND_EXIT_RIGHT:
								creep.moveTo(creep.pos.east());
								break;
						}
						creep.memory.state = 'start.survey';
					} else {
						moveToRoute(creep, route);
					}
					Counters.work(creep);
				} else {
					creep.memory.state = 'request.quest';
				}

				if (creep.memory.hasntMoved > 10) {
					creep.memory.state = 'request.quest';
				}
				break;
			case 'start.survey':
				const cr = CartographyRepo.visitedRoom(creep.room);
				survey.visited.push(cr.name);
				CartographyRepo.completeQuestById(survey.questId);
				survey.questId = null;
				creep.memory.state = 'request.quest';
				Counters.work(creep);
				break;
			default:
				if (!creep.memory.homeRoom) {
					creep.memory.homeRoom = creep.room.name;
				}
				creep.memory.survey = {
					questId: null,
					questRoom: creep.room.name,
					exitRoute: [],
					targetRoom: null,
					roomPath: [],
					visited: []
				};
				creep.memory.state = 'request.quest';
		}
	}
}

export default SurveyorRole;
