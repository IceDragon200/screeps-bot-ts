import Counters from "./counters";
import Hive from "./hive";

namespace MineEnergyStep {
	export function run(creep: Creep, currentState) {
		const source = <Source>Hive.findBy(creep.pos, FIND_SOURCES, {
			ignoreCreeps: false
		});

		if (source) {
			switch (creep.harvest(source)) {
				case OK:
					break;
				case ERR_NOT_ENOUGH_RESOURCES:
					if (creep.pos.getRangeTo(source.pos.x, source.pos.y) < 2) {
						creep.say('gt sleep');
						Counters.sleep(creep, source.ticksToRegeneration / 2);
						break;
					} else {
						creep.moveTo(source);
					}
				case ERR_NOT_IN_RANGE:
					creep.moveTo(source);
					break;
				case ERR_NO_BODYPART:
					creep.memory.role = 'idler';
					break;
			}
			Counters.work(creep);
		} else {
			creep.say("waiting");
			Counters.sleep(creep, 3);
			Counters.idle(creep);
		}
		return currentState;
	}
}

export default MineEnergyStep;
