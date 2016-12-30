import * as _ from "lodash";
import CreepQueue from "./creep_queue";
import Hive from "./hive";
import CreepRegistrar from "./registrar.creep";
import CartographyRepo from "./repo.cartography";
import Counters from "./counters";

namespace CreepSupervisor {
	const AutoSpawnRoles = ['upgrader', 'builder', 'repairer'];

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

	function spawnCreepByRole(spawner: Spawn, role) {
		const genomes = Hive.GenomesByRole[role];
		const genome = genomes[0];
		if (genome) {
			//switch (spawner.canCreateCreep(genome)) {
			switch (spawner.createCreep(genome, undefined, {role: role})) {
				case ERR_NOT_ENOUGH_ENERGY:
					Counters.sleep(spawner, 3);
					//console.log(`Spawner doesn't have enough energy`);
					break;
				case OK:
					console.log(`Created ${role}`);;
					return true;
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

	function runAudit(spawner: StructureSpawn) {
		if (spawner.room.memory['audit'] === undefined) {
			spawner.room.memory['audit'] = 0;
		}

		if (--spawner.room.memory['audit'] <= 0) {
			console.log("Conducting supervisor audit");
			spawner.room.memory['audit'] = 120;

			const sources = <Source[]>spawner.room.find(FIND_SOURCES);
			let count = 0;

			sources.forEach((src) => {
				count += countOpenSpacesAround(src);
			});

			let hc = Math.max(Math.floor(count / 2), 1);
			hc += (hc % 2);
			spawner.room.memory['popcap'] = {
				miner: count,
				//transport: count,
				upgrader: hc,
				builder: hc,
				repairer: hc
			};
		}

		if (!CartographyRepo.hasRoom(spawner.room)) {
			CartographyRepo.visitedRoom(spawner.room);
		}
	}

	export function run() {
		let creepsByRole = CreepRegistrar.groupCreepsByRole();
		if (reassignCreepsRole(creepsByRole['idler'], creepsByRole) > 0) {
			creepsByRole = CreepRegistrar.groupCreepsByRole();
		}

		let didAnySpawn = false;

		for (let name in Game.spawns) {
			const spawner = Game.spawns[name];
			runAudit(spawner);
			if (!Counters.processSleep(spawner)) {
				continue;
			}
			if (spawner.spawning) {
				continue;
			}

			let didSpawn = false;
			if (CreepQueue.hasQueued(spawner.memory.queue)) {
				console.log("Completing Queued request");
				[didSpawn, spawner.memory.queue] = CreepQueue.complete(spawner.memory.queue, (value) => {
					console.log(`Attemping to spawn queued ${value}`);
					return spawnCreepByRole(spawner, value);
				});
			}

			if (!didSpawn) {
				const popcap = spawner.room.memory['popcap'];
				// transporters and miners are MANDATORY
				if (creepsByRole['transporter'].length < creepsByRole['miner'].length) {
					didSpawn = spawnCreepByRole(spawner, 'transporter');
				} else if (creepsByRole['miner'].length < popcap['miner'].length) {
					didSpawn = spawnCreepByRole(spawner, 'miner');
				} else {
					for (let i in AutoSpawnRoles) {
						const role = AutoSpawnRoles[i];
						if (creepsByRole[role].length < popcap[role]) {
							if (spawnCreepByRole(spawner, role)) {
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
