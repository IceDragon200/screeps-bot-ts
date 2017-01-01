import Counters from "./counters";
import DisbandAction from "./action.disband";
import PatrolAction from "./action.patrol";
import RegenAction from "./action.regen";

namespace FighterRole {
	/**
	 * @param {Creep} creep
	 */
	export function run(creep: Creep) {
		switch (creep.memory.state) {
			case 'disband': {
				DisbandAction.run(creep);
			}	break;
			default: {
				const hostile = <Creep>creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
				if (hostile) {
					switch (creep.attack(hostile)) {
						case OK:
							break;
						default:
							creep.moveTo(hostile);
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
