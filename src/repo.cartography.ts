/**
 * The Cartography Repo houses information on the world as discovered by
 * the creeps.
 *
 * It will store information minerals, energy sites, controllers and other
 * data for later viewing by the hive.
 */
namespace CartographyRepo {
	/**
     * Logs the selected memory into the cartography library
     *
     * @param {Object} mem the memory to log
	 */
	export function log(mem) {
		if (mem.survey) {
			/** @todo */
		}
	}

	/**
	 * Logs a creep's survey information into the cartography memory
	 *
	 * @param {Creep} creep the creep to log
	 */
	export function logCreep(creep: Creep) {
		if (creep) {
			log(creep.memory);
			if (creep.memory.survey) {
				// The mem can now forget all about his little voyage
				delete creep.memory.survey;
			}
		}
	}

	/**
	 * Ask for a location to explore
	 */
	export function requestQuest(currentRoom: Room) {

	}
}

export default CartographyRepo;
