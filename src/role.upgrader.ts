import HarvestEnergyStep from "./state.harvest_energy";

namespace UpgraderRole {
	/** @param {Creep} creep **/
	export function run(creep: Creep) {
		if (creep.memory.upgrading && creep.carry.energy == 0) {
			creep.memory.upgrading = false;
			creep.say('harvesting');
		}

		if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
			creep.memory.upgrading = true;
			creep.say('upgrading');
		}

		if (creep.memory.upgrading) {
			if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
				creep.moveTo(creep.room.controller);
			}
			creep.memory.idle = 0;
		} else {
			HarvestEnergyStep.run(creep);
		}
	}
};

export default UpgraderRole;
