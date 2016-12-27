import Hive from "./hive";

namespace MineEnergyStep {
	export function run(creep: Creep, currentState) {
		const source = <Source>Hive.findBy(creep.pos, FIND_SOURCES, {
			ignoreCreeps: false
		});
		if (source) {
			switch (creep.harvest(source)) {
				case ERR_NOT_IN_RANGE:
					creep.moveTo(source);
					break;
				case ERR_NO_BODYPART:
					creep.memory.role = 'idler';
					break;
				case ERR_NOT_ENOUGH_RESOURCES:
					creep.memory.sleeping = 5;
					break;
			}
			creep.memory.idle = 0;
		} else {
			creep.say("waiting");
			creep.memory.sleeping = 5;
			creep.memory.idle++;
		}
		return currentState;
	}
}

export default MineEnergyStep;
