import HarvestEnergyStep from "./state.harvest_energy";

namespace UpgraderRole {
	/** @param {Creep} creep **/
	export function run(creep: Creep) {
		switch (creep.memory.state) {
			case 'enter.upgrade':
				creep.say('upgrading');
				creep.memory.state = 'upgrade';
				break;
			case 'upgrade':
				if (creep.memory.upgrading) {
					if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
						creep.moveTo(creep.room.controller);
					}
					creep.memory.idle = 0;
				} else {
					HarvestEnergyStep.run(creep);
				}

				if (creep.carry.energy <= 0) {
					creep.say('need energy');
					creep.memory.state = 'harvest.energy';
				}
				break;
			default:
				creep.memory.state = HarvestEnergyStep.run(creep, 'enter.upgrade');
		}
	}
};

export default UpgraderRole;
