import Hive from "./hive";

namespace CreepSupervisor {
	const AutoSpawnRoles = ['miner', 'upgrader', 'builder', 'repairer'];

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
		if (spawner.canCreateCreep(genome) === OK) {
			console.log(`Creating ${role}`);
			spawner.createCreep(genome, undefined, {role: role});
			return true;
		}
		return false;
	}

	function reassignIdlers(list: Creep[], creepsByRole: Hive.ICreepsByRole) {
		if (!list) return 0;

		list.forEach((c) => {
			const roles = Hive.prioritizedRoles(Hive.Roles, creepsByRole);
			const role = roles[0];
			c.memory.role = role;
			creepsByRole[role].push(c);
		});
		return list.length;
	}

	export function run() {
		Hive.creepBurial();
		let creepsByRole = Hive.groupCreepsByRole();
		if (reassignIdlers(creepsByRole['idler'], creepsByRole) > 0) {
			creepsByRole = Hive.groupCreepsByRole();
		}

		for (let name in Game.spawns) {
			const spawner = Game.spawns[name];
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

			const popcap = spawner.room.memory['popcap'];
			if (creepsByRole['transporter'].length < creepsByRole['miner'].length) {
				spawnCreepByRole(spawner, 'transporter');
			} else {
				for (let i in AutoSpawnRoles) {
					const role = AutoSpawnRoles[i];
					if (creepsByRole[role].length < popcap[role]) {
						if (spawnCreepByRole(spawner, role)) {
							break;
						}
					}
				}
			}
		}
	}
}

export default CreepSupervisor;
