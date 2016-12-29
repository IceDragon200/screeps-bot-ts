import CreepMind from "./creep_mind";
import Hive from "./hive";
import RepairAction from "./action.repair";

namespace RepairState {
	export function run(creep: Creep, currentState, nextState) {
		if (RepairAction.run(creep)) {
			CreepMind.work(creep);
		} else {
			CreepMind.idle(creep);
		}
		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}
		return currentState;
	}
}

export default RepairState;
