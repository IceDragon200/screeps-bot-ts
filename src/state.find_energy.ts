import Counters from "./counters";
import Objects from "./objects";
import Hive from "./hive";

namespace FindEnergyState {
	export const DROPPED_ENERGY = 'dropped_energy';
	export const STORED_ENERGY = 'stored_energy';
	export const FAVOURED_STORED = [STORED_ENERGY, DROPPED_ENERGY];
	export const FAVOURED_DROPPED = [DROPPED_ENERGY, STORED_ENERGY];

	function findDroppedEnergy(creep: Creep): boolean {
		const target = <Resource>Hive.findBy(creep.pos, FIND_DROPPED_ENERGY);

		if (target) {
			if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
			}
			Counters.work(creep);
			return true;
		} else {
			return false;
		}
	}

	function findStoredEnergy(creep: Creep): boolean {
		const st = <StructureContainer | StructureStorage>Hive.findBy(creep.pos, FIND_STRUCTURES, {
			filter: (s: Structure) => {
				switch (s.structureType) {
					case STRUCTURE_STORAGE:
					case STRUCTURE_CONTAINER:
						const con = <StructureContainer | StructureStorage>s;
						return con.store[RESOURCE_ENERGY] > 0;
					default:
						return false;
				}
			}
		});

		if (st) {
			switch (creep.withdraw(st, RESOURCE_ENERGY)) {
				case OK:
					creep.say("withdraw");
					break;
				case ERR_FULL:
					creep.say("I'm full");
					break;
				case ERR_NOT_ENOUGH_RESOURCES:
					creep.say("nothing");
					break;
				case ERR_NOT_IN_RANGE:
					creep.moveTo(st);
					break;
			}
			Counters.work(creep);
			return true;
		} else {
			return false;
		}
	}

	export function run(creep: Creep, currentState: string, nextState: string): string {
		const pickupPriority = Objects.patch(creep.memory, 'pickupPriority', function() {
			return FAVOURED_DROPPED;
		});

		let foundEnergy = false;
		for (let i in pickupPriority) {
			const task = pickupPriority[i];
			switch (task) {
				case DROPPED_ENERGY:
					if (findDroppedEnergy(creep)) {
						foundEnergy = true;
					}
					break;
				case STORED_ENERGY:
					if (findStoredEnergy(creep)) {
						foundEnergy = true;
					}
					break;
			}
			if (foundEnergy) {
				break;
			}
		}

		if (!foundEnergy) {
			Counters.idle(creep);
			Counters.sleep(creep, 3);
		}

		if (creep.carry.energy >= creep.carryCapacity) {
			creep.say('got en');
			return nextState;
		}
		return currentState;
	}
}

export default FindEnergyState;
