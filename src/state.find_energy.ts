import Hive from "./hive";

namespace FindEnergyState {
	export function run(creep: Creep, currentState: string, nextState: string): string {
		const target = <Resource>Hive.findBy(creep.pos, FIND_DROPPED_ENERGY);

		if (target) {
			if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
			creep.memory.idle = 0;
		} else {
			const st = <StructureContainer | StructureStorage>Hive.findBy(creep.pos, FIND_STRUCTURES, {
				filter: (s: Structure) => {
					switch (s.structureType) {
						case STRUCTURE_STORAGE:
						case STRUCTURE_CONTAINER:
							const con = <StructureContainer | StructureStorage>s;
							return con.store[RESOURCE_ENERGY] > 0;
						default:
							return false;
					}
				}
			});
			if (st) {
				switch (creep.withdraw(st, RESOURCE_ENERGY)) {
					case OK:
						creep.say("withdraw");
						break;
					case ERR_FULL:
						creep.say("I'm full");
						break;
					case ERR_NOT_ENOUGH_RESOURCES:
						creep.say("nothing");
						break;
					case ERR_NOT_IN_RANGE:
						creep.moveTo(st);
						break;
				}
				creep.memory.idle = 0;
			} else {
				const creepTarget = <Creep>Hive.findBy(creep.pos, FIND_MY_CREEPS, {
					filter: (c) => {
						return c.memory.role === 'miner';
					}
				});
				if (creepTarget) {
					creep.memory.idle = 0;
					//creep.moveTo(creepTarget);
				} else {
					creep.memory.sleeping = 3;
					creep.memory.idle += 1;
				}
			}
		}

		if (creep.carry.energy > 0) {
			creep.say('got en');
			return nextState;
		}
		return currentState;
	}
}

export default FindEnergyState;
