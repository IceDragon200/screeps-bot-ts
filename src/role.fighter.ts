import Counters from "./counters";
import DisbandAction from "./action.disband";
import PatrolAction from "./action.patrol";
import RegenAction from "./action.regen";

namespace FighterRole {
	/**
	 * @param {Creep} creep
	 */
	export function run(creep: Creep, env) {
		switch (creep.memory.state) {
			case 'disband': {
				DisbandAction.run(creep);
			}	break;
			default: {
				const hostile = <Creep>creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
				if (hostile) {
					if (creep.pos.getRangeTo(hostile) > 1) {
						creep.moveTo(hostile);
					}
					switch (creep.attack(hostile)) {
						case OK:
							break;
					}
					Counters.work(creep);
				} else {
					if (RegenAction.run(creep)) {
						Counters.work(creep);
					} else {
						if (PatrolAction.run(creep)) {
							Counters.work(creep);
						} else {
							Counters.idle(creep);
							if (creep.memory.idle > 20) {
								//creep.memory.state = 'disband';
							}
						}

					}
				}
			}
		}
	}
};

export default FighterRole;
