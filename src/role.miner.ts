import CreepRegistrar from "./registrar.creep";
import Hive from "./hive";
import MineEnergyState from "./state.mine_energy";

namespace MinerRole {
	function dropEnergy(creep: Creep) {
		if (creep.carry) {
			if (Hive.sloppyMiners) {
				if (creep.carry.energy >= 0) {
					creep.drop(RESOURCE_ENERGY);
				}
			} else {
				if (creep.carry.energy >= creep.carryCapacity) {
					creep.say('dropping');
					creep.drop(RESOURCE_ENERGY);
				}
			}
		}
	}

	function transferEnergy(creep: Creep) {
		if (creep.memory.buddy) {
			const buddy = Game.creeps[creep.memory.buddy];
			if (buddy) {
				if (creep.pos.getRangeTo(buddy) < 2) {
					if (creep.carry.energy >= 0 && (buddy.carry.energy < buddy.carryCapacity)) {
						creep.say('transfer');
						creep.transfer(buddy, RESOURCE_ENERGY);
					}
				}
			} else {
				dropEnergy(creep);
			}
		} else {
			dropEnergy(creep);
		}
	}

	export function run(creep: Creep, env) {
		if (CreepRegistrar.countRoleInRoom(env.creepsByRole, 'transporter', creep.room) == 0) {
			creep.say('> harvester');
			creep.memory.wasMiner = true;
			creep.memory.role = 'harvester';
			return;
		} else {
			CreepRegistrar.tryPartnerWithRole(env.creepsByRole, creep, 'transporter');
		}

		transferEnergy(creep);
		creep.memory.state = MineEnergyState.run(creep, 'mine.energy');
	}
}

export default MinerRole;
