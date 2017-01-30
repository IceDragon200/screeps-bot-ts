import Objects from "./objects";
import {IHasMemory} from "./__types__";
import Hive from "./hive";

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
				path.forEach(function(p) {
					obj.room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
				});
			});
		});
	}

	function layGroundWorkFor(base: StructureSpawn | Flag) {
		console.log("Laying ground work!");
		base.memory.groundWork = 2;
		const sources = <Source[]>base.room.find(FIND_SOURCES);
		const minerals = <Mineral[]>base.room.find(FIND_MINERALS);
		layRoadsFromTo([base], sources);
		layRoadsFromTo([base], [base.room.controller]);
		layRoadsFromTo(sources, [base.room.controller]);
		layRoadsFromTo([base], minerals);
		sorroundWithRoads([base, base.room.controller]);
		sorroundWithRoads(sources);
		sorroundWithRoads(minerals);
	}

	export function run(env) {
		Objects.patch(Memory, 'buildingTimer', function() {return 0;});

		if (Memory['buildingTimer'] <= 0) {
			Hive.eachSpawnPoint(function(sp) {
				Objects.patch(sp.memory, 'groundWork', function() {return 0;});
				if (--sp.memory['groundWork'] <= 0) {
					layGroundWorkFor(sp.host);
				}
			});
			Memory['buildingTimer'] = 60;
		}
		return env;
	}
}

export default HybridBuildingSupervisor;
