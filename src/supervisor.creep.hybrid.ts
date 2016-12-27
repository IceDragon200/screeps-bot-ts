import Hive from "./hive";

/**
 * A slightly overly complex and ineffecient supervisor, but tries it's hardest to balance the spawns
 */
namespace HybridCreepSupervisor {
	function neededRole(creepsByRole: Hive.ICreepsByRole, oldRole: string) {
		const roles = Hive.prioritizedRoles(Hive.Roles, creepsByRole);
		for (let i in roles) {
			const role = roles[i];
			if (role === "idler") continue;

			let [mn, mx] = Hive.PopulationCap[role];
			if (creepsByRole[role].length < mn) {
				return role;
			} else {
				if (creepsByRole[role].length < mx) {
					if (oldRole === 'idler' || creepsByRole[oldRole].length > mn) {
						return role;
					}
				}
			}
		}
		return oldRole;
	}

	/**
	 * Cleans up any dead creeps,
	 * Organizes the creeps by their role and then reassigns idling creeps to new
	 * jobs
	 */
	function roleCall() {
		const creepsByRole = Hive.groupCreepsByRole();

		for (let name in Game.creeps) {
			const creep = Game.creeps[name];

			let canChange = creep.memory.role === 'idler';

			if (!canChange && Hive.roleChanges) {
				canChange = creep.memory.idle > Hive.idleLimit;
			}

			if (canChange) {
				const oldRole: string = creep.memory.role;
				creep.memory.role = neededRole(creepsByRole, oldRole);

				if (oldRole !== creep.memory.role) {
					console.log(`Promoted from '${oldRole}' to '${creep.memory.role}'`);
					creep.say(creep.memory.role);
					creepsByRole[oldRole] = _.reject(creepsByRole[oldRole], (c) => {
						return c.id === creep.id;
					});
					creepsByRole[creep.memory.role].push(creep);
				}
			}
		}
		return creepsByRole;
	}

	function spawnWorkerOfRole(spawner: Spawn, creepsByRole: Hive.ICreepsByRole, role: string) {
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

	function executeSpawners(creepsByRole) {
		for (let name in Game.spawns) {
			const spawner = Game.spawns[name];
			spawner.memory.sleeping = Number(spawner.memory.sleeping) - 1;
			if (spawner.memory.sleeping > 0) {
				continue;
			}
			spawner.memory.sleeping = 10;

			if (spawner.spawning) continue;

			const roles = Hive.prioritizedRoles(Hive.Roles, creepsByRole);
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
		Hive.creepBurial();
		let creepsByRole = roleCall();
		creepsByRole = executeSpawners(creepsByRole);
		if (Hive.debug) {
			Hive.reportCreepsByRole(creepsByRole);
		}
	}
}

export default HybridCreepSupervisor;
