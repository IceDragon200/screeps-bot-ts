namespace FindEnergyState {
	export function run(creep, currentState, nextState) {
		const target = <Resource>creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);

		if (target) {
			if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
		} else {
			const creepTarget = <Creep>creep.pos.findClosestByPath(FIND_MY_CREEPS, {
				filter: (c) => {
					return c.memory.role === 'miner';
				}
			});
			if (creepTarget) {
				creep.moveTo(creepTarget);
			} else {
				creep.memory.sleeping = 3;
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
