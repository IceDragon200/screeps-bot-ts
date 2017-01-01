import {ExtendedRoom} from "./__types__";

namespace PatrolAction {
	export function setNextPatrol(creep: Creep, flag: Flag) {
		if (flag) {
			creep.memory.patrol.next = flag.name;
			return true;
		} else {
			creep.memory.patrol.next = null;
			return false;
		}
	}

	export function run(creep: Creep) {
		if (creep.memory.patrol) {
			const patrol = creep.memory.patrol;
			if (patrol.next) {
				const flag = Game.flags[patrol.next];
				if (flag) {
					if (Math.abs(creep.pos.getRangeTo(flag.pos)) < 2) {
						const room = <ExtendedRoom>creep.room;
						const nextFlag = room.getNextWaypointFromFlag(flag);
						setNextPatrol(creep, nextFlag);
					} else {
						creep.moveTo(flag);
					}
				} else {
					patrol.next = null;
				}
				return true;
			} else {
				const flag = <Flag>creep.pos.findClosestByRange(FIND_FLAGS, {
					filter: (f) => {
						if (f.memory.waypoint) {
							return f.memory.waypoint.name === patrol.name;
						} else {
							return false;
						}
					}
				});
				return setNextPatrol(creep, flag);
			}
		} else {
			return false;
		}
	}
}

export default PatrolAction;
