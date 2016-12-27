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
					creep.drop(RESOURCE_ENERGY);
				}
			}
		}
	}

	export function run(creep: Creep) {
		dropEnergy(creep);
		creep.memory.state = MineEnergyState.run(creep, 'mine.energy');
	}
}

export default MinerRole;
