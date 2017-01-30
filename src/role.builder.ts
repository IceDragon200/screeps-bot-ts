import FindEnergyState from "./state.find_energy";
import BuildState from "./state.build";

namespace BuilderRole {
	/**
	 * @param {Creep} creep
	 */
	export function run(creep: Creep, env) {
		switch (creep.memory.state) {
			case 'enter.build':
				creep.say('building');
				creep.memory.state = 'build';
			case 'build':
				creep.memory.state = BuildState.run(creep, 'build', 'find.energy');
				break;
			default:
				creep.memory.state = FindEnergyState.run(creep, 'find.energy', 'enter.build');
		}
	}
};

export default BuilderRole;
