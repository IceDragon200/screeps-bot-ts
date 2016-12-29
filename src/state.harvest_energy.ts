import CreepMind from "./creep_mind";
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
				CreepMind.work(creep);
			} else {
				creep.say("waiting");
				CreepMind.idle(creep);
				CreepMind.sleep(creep, 3);
			}
			return nextState;
		} else {
			creep.say('energized!');
			return currentState;
		}
	}
}

export default HarvestEnergyStep;
