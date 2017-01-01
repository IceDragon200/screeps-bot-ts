/**
 * Utility functions for handling roomObject sleeping and idling
 */
interface IHasMemory {
	memory: any;
}

/**
 * Various counters on RoomObjects
 */
namespace Counters {
	/**
	 * Reset's the object's idle to 0, meaning it is now active
	 */
	export function work<T extends IHasMemory>(obj: T): T {
		obj.memory.idle = 0;
		return obj;
	}

	/**
	 * Increment the idle counter, meaning the object has done nothing worthwile
	 */
	export function idle<T extends IHasMemory>(obj: T): T {
		if (obj.memory.idle === undefined) {
			obj.memory.idle = 0;
		}
		obj.memory.idle++;
		return obj;
	}

	/**
	 * Resets the sleep counter
	 */
	export function awaken<T extends IHasMemory>(obj: T): T {
		obj.memory.sleeping = 0;
		return obj;
	}

	/**
	 * Increase the sleep counter by duration, sleeping objects should do no work
	 */
	export function sleep<T extends IHasMemory>(obj: T, duration: number): T {
		if (obj.memory.sleeping === undefined) {
			obj.memory.sleeping = 0;
		}
		obj.memory.sleeping += Math.max(duration, 0);
		return obj;
	}

	/**
	 * Processes the object's sleep counter, and decrements it
	 *
	 * @return {boolean} true if the object is awake, false otherwise
	 */
	export function processSleep<T extends IHasMemory>(obj: T): boolean {
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
