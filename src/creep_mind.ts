/**
 * Utility functions for handling creep sleeping and idling
 */
namespace CreepMind {
	export function work(creep: Creep): Creep {
		creep.memory.idle = 0;
		return creep;
	}

	export function idle(creep: Creep): Creep {
		creep.memory.idle++;
		return creep;
	}

	export function awaken(creep: Creep): Creep {
		creep.memory.sleeping = 0;
		return creep;
	}

	export function sleep(creep: Creep, duration: number): Creep {
		creep.memory.sleeping += duration;
		return creep;
	}
}

export default CreepMind;
