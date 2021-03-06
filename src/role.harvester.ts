import CreepRegistrar from "./registrar.creep";
import HarvestEnergyState from "./state.harvest_energy";
import TransportEnergyState from "./state.transport_energy";

/**
 * Does both the job of a miner and transporter
 */
namespace HarvesterRole {
	/** @param {Creep} creep **/
	export function run(creep: Creep, env) {
		if (creep.memory.wasMiner) {
			if (CreepRegistrar.countRole(env.creepsByRole, 'transporter') > 0) {
				delete creep.memory.wasMiner;
				creep.memory.role = 'miner';
				return;
			}
		}
		switch (creep.memory.state) {
			case 'enter.transport.energy':
				creep.say('transport');
				creep.memory.state = 'transport.energy';
			case 'transport.energy':
				creep.memory.state = TransportEnergyState.run(creep, 'transport.energy', 'harvest.energy');
				break;
			default:
				creep.memory.state = HarvestEnergyState.run(creep, 'harvest.energy', 'enter.transport.energy');
		}
	}
};

export default HarvesterRole;
