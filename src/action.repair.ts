import Hive from "./hive";

namespace RepairAction {
	export function run(creep: Creep) {
		if (!(creep.carry && creep.carry.energy > 0)) {
			return false;
		}
		let damaged = <Structure>Hive.findBy(creep.pos, FIND_STRUCTURES, {
			filter: (s: Structure) => {
				if (s.structureType === STRUCTURE_WALL) {
					// ignore walls, they are low priority (unless it's below 5%)
					//return (s.hits / s.hitsMax) < 0.05;
					return s.hits < 40000;
				} else {
					return (s.hits / s.hitsMax) < 0.95;
				}
			}
		});

		if (!damaged) {
			// if we didn't find something damaged, try doing a wall instead
			let damaged = <Structure>Hive.findBy(creep.pos, FIND_STRUCTURES, {
				filter: (s: Structure) => {
					if (s.structureType === STRUCTURE_WALL) {
						return (s.hits / s.hitsMax) < 0.95;
					} else {
						return false;
					}
				}
			});
		}

		if (damaged) {
			switch (creep.repair(damaged)) {
				case ERR_NOT_IN_RANGE:
					creep.moveTo(damaged);
					break;
			}
			return true;
		}
		return false;
	}
}

export default RepairAction;
