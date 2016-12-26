import HarvestEnergyStep from "./state.harvest_energy";

namespace UpgraderRole {
	/** @param {Creep} creep **/
	export function run(creep: Creep) {
		switch (creep.memory.state) {
			case 'enter.upgrade':
				creep.say('upgrading');
				creep.memory.state = 'upgrade';
			case 'upgrade':
				if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
					creep.moveTo(creep.room.controller);
				}
				creep.memory.idle = 0;

				if (creep.carry.energy <= 0) {
					creep.say('need en');
					creep.memory.state = 'harvest.energy';
				}
				break;
			default:
				creep.memory.state = HarvestEnergyStep.run(creep, 'enter.upgrade');
		}
	}
};

export default UpgraderRole;
