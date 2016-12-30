/**
 * Utility functions for handling roomObject sleeping and idling
 */
interface IHasMemory {
	memory: any;
}

namespace Counters {
	export function work<T extends IHasMemory>(obj: T): T {
		obj.memory.idle = 0;
		return obj;
	}

	export function idle<T extends IHasMemory>(obj: T): T {
		if (obj.memory.idle === undefined) {
			obj.memory.idle = 0;
		}
		obj.memory.idle++;
		return obj;
	}

	export function awaken<T extends IHasMemory>(obj: T): T {
		obj.memory.sleeping = 0;
		return obj;
	}

	export function sleep<T extends IHasMemory>(obj: T, duration: number): T {
		if (obj.memory.sleeping === undefined) {
			obj.memory.sleeping = 0;
		}
		obj.memory.sleeping += duration;
		return obj;
	}

	export function processSleep<T extends IHasMemory>(obj: T) {
		if (obj.memory.sleeping === undefined) {
			obj.memory.sleeping = 0;
		}
		if (obj.memory.sleeping > 0) {
			--obj.memory.sleeping;
		} else if (obj.memory.sleeping < 0) {
			obj.memory.sleeping = 0;
		}
		return obj.memory.sleeping == 0;
	}
}

export default Counters;
