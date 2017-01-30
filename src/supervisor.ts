/**
 * The Supervisor module will watch over creeps: their creation,
 * cleanup and building.
 */
//import CreepSupervisor from "./supervisor.creep.hybrid";
import CreepSupervisor from "./supervisor.creep.colony";
import BuildingSupervisor from "./supervisor.building.hybrid";
import DefenseSupervisor from "./supervisor.defense";
import CreepRegistrar from "./registrar.creep";

/**
 * The Supervisor will execute all sub registrars and supervisors
 */
namespace Supervisor {
	export function run(env) {
		env = CreepRegistrar.run(env);
		env = CreepSupervisor.run(env);
		env = BuildingSupervisor.run(env);
		env = DefenseSupervisor.run(env);
		return env;
	}
};

export default Supervisor;
