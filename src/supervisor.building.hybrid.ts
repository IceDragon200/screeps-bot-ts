namespace HybridBuildingSupervisor {
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

	export function run() {
		Memory['buildingTimer'] = Number(Memory['buildingTimer']) - 1;
		if (Memory['buildingTimer'] <= 0) {
			for (let name in Game.spawns) {
				const spawner = Game.spawns[name];
				layGroundWorkFor(spawner);
			}
			Memory['buildingTimer'] = 120;
		}
	}
}

export default HybridBuildingSupervisor;
