import FindEnergyState from "./state.find_energy";
import RepairState from "./state.repair";

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
				creep.memory.state = RepairState.run(creep, 'repair', 'find.energy');
				break;
			default:
				creep.memory.state = FindEnergyState.run(creep, 'find.energy', 'enter.repair');
		}
	}
}

export default RepairerRole;
