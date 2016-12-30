import Counters from "./counters";
import Hive from "./hive";
import RepairAction from "./action.repair";

namespace RepairState {
	export function run(creep: Creep, currentState, nextState) {
		if (RepairAction.run(creep)) {
			Counters.work(creep);
		} else {
			Counters.idle(creep);
		}
		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}
		return currentState;
	}
}

export default RepairState;
