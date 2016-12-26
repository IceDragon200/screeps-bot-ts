import HarvestEnergyStep from "./state.harvest_energy";

namespace RepairerRole {
	/**
	 * @param {Creep} creep
	 */
	export function run(creep: Creep) {
		if (creep.memory.repairing) {
			const damaged = <Structure>creep.pos.findClosestByPath(FIND_STRUCTURES, {
				filter: (s: Structure) => {
					return (s.hits / s.hitsMax) < 0.95;
				}
			});

			if (damaged) {
				if (creep.repair(damaged) === ERR_NOT_IN_RANGE) {
					creep.moveTo(damaged);
				}
				creep.memory.idle = 0;
			} else {
				creep.memory.idle++;
			}
		} else {
			HarvestEnergyStep.run(creep);
		}
	}
}

export default RepairerRole;
