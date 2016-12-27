namespace BuildState {
	export function run(creep: Creep, currentState, nextState) {
		const target = <ConstructionSite>creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
			ignoreCreeps: false
		});

		if (target) {
			if (creep.build(target) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
			creep.memory.idle = 0;
		} else {
			creep.memory.sleeping = 5;
			creep.memory.idle++;
		}

		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}
		return currentState;
	}
}

export default BuildState;
