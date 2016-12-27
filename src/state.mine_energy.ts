namespace MineEnergyStep {
	export function run(creep: Creep, currentState) {
		const source = <Source>creep.pos.findClosestByPath(FIND_SOURCES, {
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
		return currentState;
	}
}

export default MineEnergyStep;
