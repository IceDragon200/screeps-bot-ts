import {ExtendedRoomPosition, ExtendedSpawn, ExtendedFlag} from "./__types__";
import * as _ from "lodash";
import ActionQueue from "./action_queue";
import Hive from "./hive";
import CreepRegistrar from "./registrar.creep";
import CartographyRepo from "./repo.cartography";
import Counters from "./counters";
import Objects from "./objects";

namespace CreepSupervisor {
	const armyPreInit = function(host, spawner, memory) {
		if (host.room.memory.patrolFlag) {
			memory.patrol = {
				name: host.room.memory.patrolFlag,
			};
		}
		return memory;
	};

	const AutoEnconomyRoles = [
		{ role: 'upgrader', memory: {} },
		{ role: 'builder', memory: {} },
		{ role: 'repairer', memory: {} },
		//{ role: 'transporter_s2', memory: {} },
	];

	const AutoArmyRoles = [
		{ role: 'archer', memory: {}, preInit: armyPreInit },
		{ role: 'fighter', memory: {}, preInit: armyPreInit },
		{ role: 'brute', memory: {}, preInit: armyPreInit }
	];

	const AutoSpawnRoles = [...AutoEnconomyRoles, ...AutoArmyRoles];

	function countOpenSpacesAround(obj: RoomObject) {
		let count = 0;
		for (let x = -1; x < 2; ++x) {
			for (let y = -1; y < 2; ++y) {
				const pos = obj.room.getPositionAt(obj.pos.x + x, obj.pos.y + y);
				const terrains = pos.lookFor(LOOK_TERRAIN);
				if (terrains.length > 0) {
					if (!_.includes(terrains, 'wall')) {
						count += 1;
					}
				}
			}
		}
		return count;
	}

	function spawnCreepByRole(host: ExtendedSpawn | ExtendedFlag, spawner: ExtendedSpawn, role: string, options = {}) {
		const prefabs = Hive.GenomesByRole[role];
		if (!prefabs) {
			return false;
		}
		const room = spawner.room;
		const spawnMemory = options['memory'] || {};

		let maxLevel = options['level'] || room.memory['levelcap'][role] || 0;
		for (; maxLevel >= 0; maxLevel--) {
			const prefab = prefabs[maxLevel];
			if (prefab) {
				switch (spawner.canCreateCreep(prefab.parts)) {
					case ERR_NOT_ENOUGH_ENERGY:
						Counters.sleep(host, 3);
						//console.log(`Spawner doesn't have enough energy`);
						break;
					case OK:
						let initialMemory = {
							...prefab.memory,
							home: _.clone(spawner.pos),
							// should the creep be recycled, it should move to a spawner and queue a recycle request
							recycle: false,
							role: prefab.role,
							level: prefab.level,
							...spawnMemory
						};
						let finalMemory = initialMemory;
						if (options['preInit']) {
							finalMemory = options['preInit'](host, spawner, finalMemory);
						}

						const code = spawner.createCreep(prefab.parts, undefined, finalMemory);
						switch (code) {
							case ERR_NOT_OWNER:
							case ERR_NAME_EXISTS:
							case ERR_BUSY:
							case ERR_INVALID_ARGS:
							case ERR_RCL_NOT_ENOUGH:
								Counters.sleep(host, 3);
								spawner.log(`Error (${code}) while trying to spawn ${role} for ${host.name}`);
								return false;
							default:
								spawner.log(`Created ${role}[${maxLevel}] for ${host.name}`);
								return true;
						}
				}
			}
		}
		return false;
	}

	function reassignCreepsRole(list: Creep[], creepsByRole: Hive.ICreepsByRole) {
		if (!list) return 0;

		list.forEach((c) => {
			const roles = CreepRegistrar.prioritizedRoles(Hive.Roles, creepsByRole);
			const role = roles[0];
			c.memory.role = role;
			creepsByRole[role].push(c);
		});
		return list.length;
	}

	function runAudit(room: Room) {
		Objects.patch(room.memory, 'audit', () => {return 0;});

		if (--room.memory['audit'] <= 0) {
			console.log("Conducting supervisor audit");

			const spawn = Game.spawns[Object.keys(Game.spawns)[0]];
			let isOurRoom = false;
			if (room.controller.owner) {
				isOurRoom = room.controller.owner.username == spawn.room.controller.owner.username;
			}

			const sources = <Source[]>room.find(FIND_SOURCES);
			let count = 0;

			sources.forEach((src) => {
				count += countOpenSpacesAround(src);
			});

			let hc = Math.max(Math.floor(count / 2), 1);
			hc += (hc % 2);

			room.memory['levelcap'] = {};

			const energyCap = room.energyCapacityAvailable;
			for (let role in Hive.GenomesByRole) {
				const prefabs = Hive.GenomesByRole[role];
				let level = 0;
				for (; level < prefabs.length; ++level) {
					if (energyCap < prefabs[level].cost) {
						break;
					}
				}
				room.memory['levelcap'][role] = Math.min(level, prefabs.length - 1);
			}

			room.memory['popcap'] = {
				miner: count,
				transporter: count + (isOurRoom ? 3 : 0),
				transporter_s2: isOurRoom ? 4 : 0,
				upgrader: isOurRoom ? count : 0,
				builder: hc,
				repairer: hc,
				archer: isOurRoom ? 2 : 0,
				fighter: isOurRoom ? 2 : 0,
				brute: isOurRoom ? 0 :0
			};

			if (!CartographyRepo.hasRoom(room)) {
				CartographyRepo.visitedRoom(room);
			}

			console.log(`[${room.name}] Is Owned By Us: ${isOurRoom}`);
			console.log(`[${room.name}] Energy Capacity ${energyCap}`);
			for (let role in room.memory['levelcap']) {
				const lvl = room.memory['levelcap'][role];
				const pop = room.memory['popcap'][role];

				const prefab = Hive.GenomesByRole[role][lvl];
				const cost = prefab ? prefab.cost : '?';

				if (pop) {
					console.log(`[${room.name}] Available ${role}[${lvl}] / ${pop} @ ${cost} EN`);
				}
			}

			room.memory['audit'] = 120;
		}
	}

	export function run(env) {
		let creepsByRole = CreepRegistrar.groupCreepsByRole();
		if (reassignCreepsRole(creepsByRole['idler'], creepsByRole) > 0) {
			creepsByRole = CreepRegistrar.groupCreepsByRole();
		}

		env.creepsByRole = creepsByRole;

		let didAnySpawn = false;

		Hive.eachAnchor(function(flag) {
			if (flag.room) {
				runAudit(flag.room);
			}
		});

		for (let roomName in Memory.rooms) {
			const room = Game.rooms[roomName];
			if (room) {
				runAudit(room);
			}
		}

		Hive.eachSpawnPoint(function(spawnPoint) {
			if (!Counters.processSleep(spawnPoint.host)) {
				return;
			}

			if (spawnPoint.spawner.spawning) {
				return;
			}

			if (--spawnPoint.spawner.memory['recycleTimer'] <= 0) {
				const creeps = <Creep[]>spawnPoint.spawner.pos.findInRange(FIND_MY_CREEPS, 1, {
					filter: (c: Creep) => {
						return c.memory.recycle;
					}
				});

				if (creeps.length > 0) {
					const creep = creeps[0];
					switch (spawnPoint.spawner.recycleCreep(creep)) {
						case OK:
							spawnPoint.spawner.log(`Recycling creep ${creep.name}`);
							break
						case ERR_NOT_IN_RANGE:
							spawnPoint.spawner.log(`Creep is too far! ${creep.name}`);
							break;
						default:
					}
				}
				spawnPoint.spawner.memory['recycleTimer'] = 15;
			}

			let didSpawn = false;
			// only actual spawners may complete their queue
			if (ActionQueue.hasQueued(spawnPoint.host.memory.unitQueue)) {
				spawnPoint.spawner.log("Completing Queued request");
				let actionResult = ActionQueue.ActionResult.REJECT;
				[actionResult, spawnPoint.host.memory.unitQueue] = ActionQueue.complete(spawnPoint.host.memory.unitQueue, (action) => {
					switch (action.name) {
						case 'spawn':
							const role = action.params[0];
							const options = action.params[1] || {};
							spawnPoint.spawner.log(`Attemping to spawn queued ${role}`);
							if (spawnCreepByRole(spawnPoint.host, spawnPoint.spawner, role, options)) {
								return ActionQueue.ActionResult.OK;
							} else {
								return ActionQueue.ActionResult.WORKING;
							}
						default:
							console.log(`cant handle action ${action.name}`);
							return ActionQueue.ActionResult.REJECT;
					}
				});
				if (actionResult === ActionQueue.ActionResult.OK) {
					didSpawn = true;
				}
			}

			if (!didSpawn) {
				const room = spawnPoint.host.room;
				const popcap = room.memory['popcap'];
				const spawnOptions = {memory: spawnPoint.memory};
				// transporters and miners are MANDATORY
				const minersInRoom = CreepRegistrar.countRoleInRoom(creepsByRole, 'miner', room);
				if (!CreepRegistrar.hasEnoughOfRoleInRoom(creepsByRole, 'transporter', minersInRoom, room)) {
					didSpawn = spawnCreepByRole(spawnPoint.host, spawnPoint.spawner, 'transporter', spawnOptions);
				} else if (!CreepRegistrar.hasEnoughOfRoleInRoom(creepsByRole, 'miner', popcap['miner'], room)) {
					didSpawn = spawnCreepByRole(spawnPoint.host, spawnPoint.spawner, 'miner', spawnOptions);
				} else {
					// we can spawn everything else later
					for (let i in AutoSpawnRoles) {
						const preset = AutoSpawnRoles[i];
						const roleCap = popcap[preset.role] || 0;
						if (CreepRegistrar.countRoleInRoom(creepsByRole, preset.role, room) < roleCap) {
							const options = {
								preInit: preset['preInit'],
								memory: {
									...spawnPoint.memory,
									...(preset.memory || {})
								}
							};

							if (spawnCreepByRole(spawnPoint.host, spawnPoint.spawner, preset.role, options)) {
								didSpawn = true;
								break;
							}
						}
					}
				}
			}

			if (didSpawn) {
				didAnySpawn = true;
			} else {
				Counters.sleep(spawnPoint.host, 3);
			}
		});

		if (didAnySpawn) {
			CreepRegistrar.reportCreepsByRole(creepsByRole);
		}

		return env;
	}
}

export default CreepSupervisor;
