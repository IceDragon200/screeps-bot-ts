import CreepMind from "./creep_mind";
import IdleAction from "./action.idle";
import RepairAction from "./action.repair";

namespace BuildState {
	export function run(creep: Creep, currentState, nextState) {
		const target = <ConstructionSite>creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
			ignoreCreeps: false
		});

		if (target) {
			if (creep.build(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
			CreepMind.work(creep);
		} else {
			if (RepairAction.run(creep)) {
				CreepMind.work(creep);
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
