namespace TransportEnergyState {
	export function run(creep: Creep, currentState, nextState) {
		const target = <Structure>creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
			filter: (st) => {
				switch (st.structureType) {
					case STRUCTURE_STORAGE:
					case STRUCTURE_EXTENSION:
					case STRUCTURE_SPAWN:
						return st.energy < st.energyCapacity;
					default:
						return false;
				}
			}
		});
		if (target) {
			if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
			creep.memory.idle = 0;
		} else {
			if (creep.memory.idle++ > 20) {
				const flags = _.filter(Game.flags, (f) => {
					return f.name === "idlers.corner";
				});

				if (flags.length > 0) {
					console.log("Moving to idlers corner");
					creep.moveTo(flags[0]);
				}
			}
		}

		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}
		return currentState;
	}
}

export default TransportEnergyState;
