import Counters from "./counters";
import Hive from "./hive";

namespace HarvestEnergyStep {
	export function run(creep: Creep, currentState: string, nextState: string) {
		if (creep.carry.energy < creep.carryCapacity) {
			const source = <Source>Hive.findBy(creep.pos, FIND_SOURCES, {
				ignoreCreeps: false
			});
			if (source) {
				switch (creep.harvest(source) ) {
					case OK:
						break;
					case ERR_NOT_IN_RANGE:
						creep.moveTo(source);
						break;
				}
				Counters.work(creep);
			} else {
				creep.say("waiting");
				Counters.idle(creep);
				Counters.sleep(creep, 3);
			}
			return currentState;
		} else {
			creep.say('energized!');
			return nextState;
		}
	}
}

export default HarvestEnergyStep;
