import * as _ from "lodash";
import Counters from "./counters";
import Objects from "./objects";
import Hive from "./hive";

namespace FindEnergyState {
	export const DROPPED_ENERGY = 'dropped_energy';
	export const STORED_ENERGY = 'stored_energy';
	export const FAVOURED_STORED = [STORED_ENERGY, DROPPED_ENERGY];
	export const FAVOURED_DROPPED = [DROPPED_ENERGY, STORED_ENERGY];

	function findDroppedEnergy(creep: Creep): Resource {
		const target = <Resource>Hive.findBy(creep.pos, FIND_DROPPED_ENERGY);

		if (target) {
			if (creep.pos.getRangeTo(target) > 1) {
				creep.moveTo(target);
			}

			switch (creep.pickup(target)) {
				case OK:
					break;
				case ERR_NOT_IN_RANGE:
					creep.moveTo(target);
					break;
			}
			Counters.work(creep);
			return target;
		} else {
			return null;
		}
	}

	function findStoredEnergy(creep: Creep): StructureContainer | StructureStorage {
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
			if (creep.pos.getRangeTo(st) > 1) {
				creep.moveTo(st);
			}
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
			return st;
		} else {
			return null;
		}
	}

	export function runPickup(creep: Creep) {
		if (creep.carry.energy >= creep.carryCapacity) {
			return;
		}

		const pickupPriority = Objects.patch(creep.memory, 'pickupPriority', function() {
			console.log(`${creep.name} Initializing pickupPriority`);
			return creep.memory.buddy ? FAVOURED_DROPPED : FAVOURED_STORED;
		});

		let foundEnergy = false;
		for (let i in pickupPriority) {
			const task = pickupPriority[i];
			switch (task) {
				case DROPPED_ENERGY: {
					const dropped = findDroppedEnergy(creep);
					if (dropped) {
						creep.memory.withdrewFrom = {
							type: 'dropped',
							pos: _.clone(dropped.pos)
						};
						foundEnergy = true;
					}
				}	break;
				case STORED_ENERGY: {
					// Prevent withdrawing from previously transfered to
					if (creep.memory.transferredTo) {
						if (creep.memory.transferredTo.type === 'storage') {
							break;
						}
					}
					const storage = findStoredEnergy(creep);
					if (storage) {
						creep.memory.withdrewFrom = {
							type: 'storage',
							pos: _.clone(storage.pos)
						};
						foundEnergy = true;
					}
				}	break;
			}
			if (foundEnergy) {
				break;
			}
		}

		if (!foundEnergy) {
			Counters.idle(creep);
			Counters.sleep(creep, 3);
		}
	}

	export function run(creep: Creep, currentState: string, nextState: string): string {
		if (creep.memory.buddy) {
			const buddy = Game.creeps[creep.memory.buddy];
			if (buddy) {
				if (creep.pos.getRangeTo(buddy) > 1) {
					creep.moveTo(buddy);
				} else {
					runPickup(creep);
				}
			} else {
				runPickup(creep);
			}
		} else {
			runPickup(creep);
		}

		if (creep.carry.energy >= creep.carryCapacity) {
			creep.say('got en');
			return nextState;
		}
		return currentState;
	}
}

export default FindEnergyState;
