import MineEnergyState from "./state.mine_energy";

namespace MinerRole {
	export function run(creep: Creep) {
		if (creep.carry) {
			if (creep.carry.energy > 0) {
				creep.drop(RESOURCE_ENERGY);
			}
		}
		creep.memory.state = MineEnergyState.run(creep, 'mine.energy');
	}
}

export default MinerRole;
