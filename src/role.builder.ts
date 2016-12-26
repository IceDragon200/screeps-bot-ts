import HarvestEnergyStep from "./state.harvest_energy";

namespace BuilderRole {
	/**
	 * @param {Creep} creep
	 */
	export function run(creep: Creep) {
		switch (creep.memory.state) {
			case 'enter.build':
				creep.say('building');
				creep.memory.state = 'build';
			case 'build':
				const target = <ConstructionSite>creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
					ignoreCreeps: false
				});

				if (target) {
					if (creep.build(target) == ERR_NOT_IN_RANGE) {
						creep.moveTo(target);
					}
					creep.memory.idle = 0;
				} else {
					creep.memory.sleeping = 5;
					creep.memory.idle++;
				}

				if (creep.carry.energy <= 0) {
					creep.say('need energy');
					creep.memory.state = 'harvest.energy';
				}
				break;
			default:
				creep.memory.state = HarvestEnergyStep.run(creep, 'enter.build');
		}
	}
};

export default BuilderRole;
