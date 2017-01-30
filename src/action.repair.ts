import * as _ from "lodash";
import Hive from "./hive";

namespace RepairAction {
	export function run(creep: Creep) {
		if (!(creep.carry && creep.carry.energy > 0)) {
			return false;
		}

		if (!creep.memory.repairTarget) {
			let damaged = <Structure>Hive.findBy(creep.pos, FIND_STRUCTURES, {
				filter: (s: Structure) => {
					switch (s.structureType) {
						case STRUCTURE_WALL:
						case STRUCTURE_RAMPART:
							// ignore walls, they are low priority (unless it's below 5%)
							//return (s.hits / s.hitsMax) < 0.05;
							return s.hits < 40000;
						default:
							return (s.hits / s.hitsMax) < 0.95;
					}
				}
			});

			if (!damaged) {
				// if we didn't find something damaged, try doing a wall instead
				let damaged = <Structure>Hive.findBy(creep.pos, FIND_STRUCTURES, {
					filter: (s: Structure) => {
						switch (s.structureType) {
							case STRUCTURE_WALL:
							case STRUCTURE_RAMPART:
								return (s.hits / s.hitsMax) < 0.95;
							default:
								return false;
						}
					}
				});
			}

			if (damaged) {
				creep.memory.repairTarget = _.clone(damaged.pos);
			}
		}

		if (creep.memory.repairTarget) {
			const t = creep.memory.repairTarget;
			const pos = new RoomPosition(t.x, t.y, t.roomName);
			if (creep.pos.getRangeTo(pos) > 3) {
				creep.moveTo(pos);
				return true;
			} else {
				const results = creep.room.lookAt(pos);
				const target = _.find(results, (r) => {
					return r.structure;
				});
				if (target) {
					switch (creep.repair(target.structure)) {
						case ERR_NOT_IN_RANGE:
							//creep.moveTo(target.structure);
							break;
					}
					const per = target.structure.hits / target.structure.hitsMax;
					if (per > 0.9) {
						creep.memory.repairTarget = null;
					}
					return true;
				} else {
					creep.memory.repairTarget = null;
				}
			}
		}
		return false;
	}
}

export default RepairAction;
