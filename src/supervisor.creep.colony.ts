import {ExtendedRoomPosition, ExtendedSpawn} from "./__types__";
import * as _ from "lodash";
import ActionQueue from "./action_queue";
import Hive from "./hive";
import CreepRegistrar from "./registrar.creep";
import CartographyRepo from "./repo.cartography";
import Counters from "./counters";
import Objects from "./objects";

namespace CreepSupervisor {
	const AutoSpawnRoles = [
		{ role: 'upgrader', memory: {} },
		{ role: 'builder', memory: {} },
		{ role: 'repairer', memory: {} },
		{ role: 'transporter_s2', memory: {} },
		{ role: 'archer', memory: {partol: {name: 'patrol'}} },
		{ role: 'fighter', memory: {partol: {name: 'patrol'}} },
		{ role: 'brute', memory: {partol: {name: 'patrol'}} }
	];

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

	function spawnCreepByRole(spawner: ExtendedSpawn, role: string, spawnMemory = {}) {
		const room = spawner.room;
		const prefabs = Hive.GenomesByRole[role];

		if (!prefabs) {
			return false;
		}

		let maxLevel = room.memory['levelcap'][role] || 0;
		for (; maxLevel >= 0; maxLevel--) {
			const prefab = prefabs[maxLevel];
			if (prefab) {
				switch (spawner.canCreateCreep(prefab.parts)) {
					case ERR_NOT_ENOUGH_ENERGY:
						Counters.sleep(spawner, 3);
						//console.log(`Spawner doesn't have enough energy`);
						break;
					case OK:
						const initialMemory = {
							...prefab.memory,
							home: _.clone(spawner.pos),
							// should the creep be recycled, it should move to a spawner and queue a recycle request
							recycle: false,
							role: prefab.role,
							level: prefab.level,
							...spawnMemory
						};
						const code = spawner.createCreep(prefab.parts, undefined, initialMemory);
						switch (code) {
							case ERR_NOT_OWNER:
							case ERR_NAME_EXISTS:
							case ERR_BUSY:
							case ERR_INVALID_ARGS:
							case ERR_RCL_NOT_ENOUGH:
								Counters.sleep(spawner, 3);
								spawner.log(`Error (${code}) while trying to spawn ${role}`);
								return false;
							default:
								spawner.log(`Created ${role}[${maxLevel}]`);;
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
				transporter: count,
				transporter_s2: 4,
				upgrader: hc,
				builder: hc,
				repairer: hc,
				archer: 2,
				fighter: 1,
				brute: 0
			};

			if (!CartographyRepo.hasRoom(room)) {
				CartographyRepo.visitedRoom(room);
			}

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

	export function run() {
		let creepsByRole = CreepRegistrar.groupCreepsByRole();
		if (reassignCreepsRole(creepsByRole['idler'], creepsByRole) > 0) {
			creepsByRole = CreepRegistrar.groupCreepsByRole();
		}

		let didAnySpawn = false;

		for (let roomName in Memory.rooms) {
			runAudit(Game.rooms[roomName]);
		}

		for (let name in Game.spawns) {
			const spawner = <ExtendedSpawn>Game.spawns[name];

			if (!Counters.processSleep(spawner)) {
				continue;
			}

			if (spawner.spawning) {
				continue;
			}

			if (--spawner.memory['recycleTimer'] <= 0) {
				const creeps = <Creep[]>spawner.pos.findInRange(FIND_MY_CREEPS, 1, {
					filter: (c: Creep) => {
						return c.memory.recycle;
					}
				});
				if (creeps.length > 0) {
					const creep = creeps[0];
					switch (spawner.recycleCreep(creep)) {
						case OK:
							spawner.log(`Recycling creep ${creep.name}`);
							break
						case ERR_NOT_IN_RANGE:
							spawner.log(`Creep is too far! ${creep.name}`);
							break;
						default:
					}
				}
				spawner.memory['recycleTimer'] = 15;
			}

			let didSpawn = false;
			if (ActionQueue.hasQueued(spawner.memory.queue)) {
				spawner.log("Completing Queued request");
				[didSpawn, spawner.memory.unitQueue] = ActionQueue.complete(spawner.memory.unitQueue, (value) => {
					spawner.log(`Attemping to spawn queued ${value}`);
					return spawnCreepByRole(spawner, value.params[0]);
				});
			}

			if (!didSpawn) {
				const popcap = spawner.room.memory['popcap'];
				// transporters and miners are MANDATORY
				if (!CreepRegistrar.hasEnoughOfRole(creepsByRole, 'transporter', CreepRegistrar.countRole(creepsByRole, 'miner'))) {
					didSpawn = spawnCreepByRole(spawner, 'transporter');
				} else if (!CreepRegistrar.hasEnoughOfRole(creepsByRole, 'miner', popcap['miner'])) {
					didSpawn = spawnCreepByRole(spawner, 'miner');
				} else {
					// we can spawn everything else later
					for (let i in AutoSpawnRoles) {
						const preset = AutoSpawnRoles[i];
						const roleCap = popcap[preset.role] || 0;
						if (CreepRegistrar.countRole(creepsByRole, preset.role) < roleCap) {
							if (spawnCreepByRole(spawner, preset.role, preset.memory)) {
								didSpawn = true;
								break;
							}
						}
					}
				}
			}

			if (didSpawn) didAnySpawn = true;
		}

		if (didAnySpawn) {
			CreepRegistrar.reportCreepsByRole(creepsByRole);
		}
	}
}

export default CreepSupervisor;
