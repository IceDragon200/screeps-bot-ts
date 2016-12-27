/**
 * The Supervisor module will watch over creeps: their creation,
 * cleanup and building.
 */
import Hive from "./hive";

type IWorkersByRole = {[role: string]: Creep[]};

namespace Supervisor {
	const population = Hive.PopulationCap;

	function prioritizedRoles(roles: string[], workersByRole: IWorkersByRole) {
		return _.sortBy(_.clone(roles), (role) => {
			return workersByRole[role].length;
		});
	}

	function neededRole(workersByRole, oldRole) {
		const roles = prioritizedRoles(Hive.Roles, workersByRole);
		for (let i in roles) {
			const role = roles[i];
			if (role === "idler") continue;

			let [mn, mx] = population[role];
			if (workersByRole[role].length < mn) {
				return role;
			} else {
				if (workersByRole[role].length < mx) {
					if (oldRole === 'idler' || workersByRole[oldRole].length > mn) {
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
		if (--Memory['gcTimer'] < 0) {
			for (let name in Memory['creeps']) {
				if (!Game.creeps[name]) {
					delete Memory['creeps'][name];
					console.log(`Cremated ${name}`);
				}
			}
			Memory['gcTimer'] = 60;
		}

		const workersByRole: IWorkersByRole = {};
		Hive.Roles.forEach(function(role) {
			workersByRole[role] = [];
		});

		let count = 0;
		for (let name in Game.creeps) {
			const creep = Game.creeps[name];
			const role = creep.memory.role;
			if (!workersByRole[role]) {
				workersByRole[role] = [];
			}
			workersByRole[role].push(creep);
		}

		for (let name in Game.creeps) {
			const creep = Game.creeps[name];
			if (creep.memory.role === 'idler') {
				const oldRole: string = creep.memory.role;
				creep.memory.role = neededRole(workersByRole, oldRole);

				if (oldRole !== creep.memory.role) {
					console.log(`Moved idling creep from '${oldRole}' to '${creep.memory.role}'`);
					creep.say(creep.memory.role);
					workersByRole[oldRole] = _.reject(workersByRole[oldRole], (c) => {
						return c.id === creep.id;
					});
					workersByRole[creep.memory.role].push(creep);
				}
			}
			count++;
		}
		return workersByRole;
	}

	function sorroundWithRoads(objs: RoomObject[]) {
		objs.forEach((obj) => {
			for (let fx = -1; fx < 2; ++fx) {
				for (let fy = -1; fy < 2; ++fy) {
					obj.room.createConstructionSite(obj.pos.x + fx, obj.pos.y + fy, STRUCTURE_ROAD);
				}
			}
		});
	}

	function layRoadsFromTo(objs: RoomObject[], targets: RoomObject[]) {
		objs.forEach((obj) => {
			targets.forEach((tr) => {
				const path = obj.pos.findPathTo(tr.pos.x, tr.pos.y, {
					ignoreCreeps: true,
					ignoreRoads: false,
					ignoreDestructibleStructures: true
				});
				path.forEach((p) => {
					obj.room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
				});
			});
		});
	}

	function spawnWorkerOfRole(spawner: Spawn, workersByRole, role) {
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
					workersByRole[role].push(spawner.spawning);
					return true;
			}
		}
		return false;
	}

	function layGroundWorkFor(spawner: Spawn) {
		console.log("Laying ground work!");
		spawner.memory.groundWork = 150;
		const sources = <Source[]>spawner.room.find(FIND_SOURCES);
		const minerals = <Mineral[]>spawner.room.find(FIND_MINERALS);
		layRoadsFromTo([spawner], sources);
		layRoadsFromTo([spawner], [spawner.room.controller]);
		layRoadsFromTo(sources, [spawner.room.controller]);
		layRoadsFromTo([spawner], minerals);
		sorroundWithRoads([spawner, spawner.room.controller]);
		sorroundWithRoads(sources);
		sorroundWithRoads(minerals);
	}

	function spawnWorkers(workersByRole) {
		for (let name in Game.spawns) {
			const spawner = Game.spawns[name];
			if (spawner.memory.sleeping === undefined) {
				spawner.memory.sleeping = 0;
			}
			if (--spawner.memory.sleeping > 0) {
				continue;
			}
			spawner.memory.sleeping = 0;
			if (--spawner.memory.groundWork <= 0) {
				layGroundWorkFor(spawner);
			}

			if (spawner.spawning) continue;

			const roles = prioritizedRoles(Hive.Roles, workersByRole);
			for (let i in roles) {
				const role = roles[i];
				let [mn, _mx] = population[role];
				if (workersByRole[role].length >= mn) {
					continue;
				}

				if (spawnWorkerOfRole(spawner, workersByRole, role)) {
					break;
				}
				spawner.memory.sleeping = 10;
			};
		}
		return workersByRole;
	}

	export function run() {
		let workersByRole = roleCall();
		workersByRole = spawnWorkers(workersByRole);

		if (Hive.debug) {
			Hive.Roles.forEach(function(role) {
				const [mn, mx] = population[role];
				console.log(`Workers available ${role}: ${workersByRole[role].length} / ${mn} / ${mx}`);
			});
		}
	}
};

export default Supervisor;
