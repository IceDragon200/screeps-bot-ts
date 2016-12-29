import Hive from "./hive";
import CreepRegistrar from "./registrar.creep";

/**
 * A slightly overly complex and ineffecient supervisor, but tries it's hardest to balance the spawns
 */
namespace HybridCreepSupervisor {
	function spawnWorkerOfRole(spawner: StructureSpawn, creepsByRole: Hive.ICreepsByRole, role: string) {
		const genomes = Hive.GenomesByRole[role];
		const lv = Math.min(Math.max(0, spawner.room.controller.level - 1), genomes.length - 1);
		const genome = genomes[lv];
		if (spawner.canCreateCreep(genome) == OK) {
			switch (spawner.createCreep(genome, undefined, {role: role})) {
				case ERR_NOT_OWNER:
				case ERR_NAME_EXISTS:
				case ERR_BUSY:
				case ERR_NOT_ENOUGH_ENERGY:
				case ERR_INVALID_ARGS:
				case ERR_RCL_NOT_ENOUGH:
					if (Hive.debug) {
						console.log("Spawning Failed.");
					}
					break;
				default:
					if (Hive.debug) {
						console.log(`Spawning a new ${role}`);
					}
					creepsByRole[role].push(spawner.spawning);
					return true;
			}
		}
		return false;
	}

	function executeSpawners(creepsByRole: Hive.ICreepsByRole) {
		for (let name in Game.spawns) {
			const spawner = Game.spawns[name];
			spawner.memory.sleeping = Number(spawner.memory.sleeping) - 1;
			if (spawner.memory.sleeping > 0) {
				continue;
			}
			spawner.memory.sleeping = 10;

			if (spawner.spawning) continue;

			const roles = CreepRegistrar.prioritizedRoles(Hive.Roles, creepsByRole);
			for (let i in roles) {
				const role = roles[i];
				let [mn, _mx] = Hive.PopulationCap[role];
				if (creepsByRole[role].length >= mn) {
					continue;
				}

				if (spawnWorkerOfRole(spawner, creepsByRole, role)) {
					break;
				}
			};
		}
		return creepsByRole;
	}

	export function run() {
		let creepsByRole = CreepRegistrar.roleCall();
		creepsByRole = executeSpawners(creepsByRole);
		if (Hive.debug) {
			CreepRegistrar.reportCreepsByRole(creepsByRole);
		}
	}
}

export default HybridCreepSupervisor;
