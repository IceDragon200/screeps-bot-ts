import CreepRegistrar from "./registrar.creep";
import TransportEnergyState from "./state.transport_energy";
import FindEnergyState from "./state.find_energy";

namespace TransporterRole {
	export function run(creep: Creep, env) {
		CreepRegistrar.tryPartnerWithRole(env.creepsByRole, creep, 'miner');

		switch (creep.memory.state) {
			case 'find.energy':
				creep.memory.state = FindEnergyState.run(creep, 'find.energy', 'transport.energy');
				break;
			default:
				creep.memory.state = TransportEnergyState.run(creep, 'transport.energy', 'find.energy');
		}
	}
}

export default TransporterRole;
