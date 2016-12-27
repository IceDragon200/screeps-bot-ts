import Hive from "./hive";

namespace HarvestEnergyStep {
	export function run(creep: Creep, currentState, nextState) {
		if (creep.carry.energy < creep.carryCapacity) {
			const source = <Source>Hive.findBy(creep.pos, FIND_SOURCES, {
				ignoreCreeps: false
			});
			if (source) {
				if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
					creep.moveTo(source);
				}
				creep.memory.idle = 0;
			} else {
				creep.say("waiting");
				creep.memory.sleeping = 5;
				creep.memory.idle++;
			}
			return nextState;
		} else {
			creep.say('energized!');
			return currentState;
		}
	}
}

export default HarvestEnergyStep;
