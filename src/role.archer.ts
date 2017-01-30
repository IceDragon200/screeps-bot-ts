import Counters from "./counters";
import DisbandAction from "./action.disband";
import PatrolAction from "./action.patrol";
import RegenAction from "./action.regen";

namespace ArcherRole {
	/**
	 * @param {Creep} creep
	 */
	export function run(creep: Creep, env) {
		switch (creep.memory.state) {
			case 'disband':
				DisbandAction.run(creep);
				break;
			default:
				const hostile = <Creep>creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
				if (hostile) {
					switch (creep.rangedAttack(hostile)) {
						case OK:
							break;
						default:
							creep.moveTo(hostile);
					}
				} else {
					if (RegenAction.run(creep)) {
						console.log('Regenerated');
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
};

export default ArcherRole;
