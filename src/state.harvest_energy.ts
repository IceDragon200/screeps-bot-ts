import Counters from "./counters";
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
				Counters.work(creep);
			} else {
				creep.say("waiting");
				Counters.idle(creep);
				Counters.sleep(creep, 3);
			}
			return nextState;
		} else {
			creep.say('energized!');
			return currentState;
		}
	}
}

export default HarvestEnergyStep;
