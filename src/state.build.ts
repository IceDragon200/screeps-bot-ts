import * as _ from "lodash";
import Counters from "./counters";
import Hive from "./hive";
import IdleAction from "./action.idle";
import RepairAction from "./action.repair";

namespace BuildState {
	export function run(creep: Creep, currentState, nextState) {
		if (!creep.memory.buildTarget) {
			const target = <RoomObject>creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
				ignoreCreeps: false
			});

			if (target) {
				creep.memory.buildTarget = _.clone(target.pos);
			}
		}

		if (creep.memory.buildTarget) {
			const t = creep.memory.buildTarget;
			const pos = new RoomPosition(t.x, t.y, t.roomName);
			if (creep.pos.getRangeTo(pos) > 3) {
				creep.moveTo(pos);
			} else {
				const results = creep.room.lookAt(pos);
				const target = _.find(results, (r) => {
					return r.constructionSite;
				});
				if (target) {
					switch (creep.build(target.constructionSite)) {
						case ERR_NOT_IN_RANGE:
							creep.moveTo(target.constructionSite);
							break;
					}
				} else {
					creep.memory.buildTarget = null;
				}
			}

			Counters.work(creep);
		} else {
			if (RepairAction.run(creep)) {
				Counters.work(creep);
			} else {
				IdleAction.run(creep);
			}
		}

		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}
		return currentState;
	}
}

export default BuildState;
