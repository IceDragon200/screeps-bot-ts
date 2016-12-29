import CreepMind from "./creep_mind";
import Hive from "./hive";

namespace FindEnergyState {
	export function run(creep: Creep, currentState: string, nextState: string): string {
		const target = <Resource>Hive.findBy(creep.pos, FIND_DROPPED_ENERGY);

		if (target) {
			if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
			CreepMind.work(creep);
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
				CreepMind.work(creep);
			} else {
				const creepTarget = <Creep>Hive.findBy(creep.pos, FIND_MY_CREEPS, {
					filter: (c) => {
						return c.memory.role === 'miner';
					}
				});
				if (creepTarget) {
					CreepMind.work(creep);
					//creep.moveTo(creepTarget);
				} else {
					CreepMind.idle(creep);
					CreepMind.sleep(creep, 3);
				}
			}
		}

		if (creep.carry.energy >= creep.carryCapacity) {
			creep.say('got en');
			return nextState;
		}
		return currentState;
	}
}

export default FindEnergyState;
