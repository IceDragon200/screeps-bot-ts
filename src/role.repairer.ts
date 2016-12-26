import HarvestEnergyStep from "./state.harvest_energy";

namespace RepairerRole {
	/**
	 * @param {Creep} creep
	 */
	export function run(creep: Creep) {
		switch (creep.memory.state) {
			case 'enter.repair':
				creep.say('repairing');
				creep.memory.state = 'repair';
			case 'repair':
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
				if (creep.carry.energy <= 0) {
					creep.say('need energy');
					creep.memory.state = 'harvest.energy';
				}
				break;
			default:
				creep.memory.state = HarvestEnergyStep.run(creep, 'enter.repair');
		}
	}
}

export default RepairerRole;
