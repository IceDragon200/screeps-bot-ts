/**
 * The Supervisor module will watch over creeps: their creation,
 * cleanup and building.
 */
//import CreepSupervisor from "./supervisor.creep.hybrid";
import CreepSupervisor from "./supervisor.creep.colony";
import BuildingSupervisor from "./supervisor.building.hybrid";
import DefenseSupervisor from "./supervisor.defense";

namespace Supervisor {
	export function run() {
		CreepSupervisor.run();
		BuildingSupervisor.run();
		DefenseSupervisor.run();
	}
};

export default Supervisor;
