import * as _ from "lodash";
import Counters from "./counters";
import Hive from "./hive";
import IdleAction from "./action.idle";

/**
 * Fills target structures with energy
 */
namespace TransportEnergyState {
	function transportToTarget(creep: Creep, target: Structure) {
		if (target) {
			switch (creep.transfer(target, RESOURCE_ENERGY)) {
				case OK:
					creep.say("filling");
					break;
				case ERR_FULL:
					creep.say("its full");
					break;
				case ERR_NOT_IN_RANGE:
					creep.moveTo(target);
					break;
			}
			return true;
		} else {
			return false;
		}
	}

	export function run(creep: Creep, currentState: string, nextState: string) {
		// prioritize extensions and spawns first
		let target = <Structure>Hive.findBy(creep.pos, FIND_STRUCTURES, {
			filter: (st: Structure) => {
				switch (st.structureType) {
					case STRUCTURE_EXTENSION:
					case STRUCTURE_SPAWN:
						if (st instanceof OwnedStructure) {
							const sp = <StructureSpawn | StructureExtension>st;
							return sp.energy < sp.energyCapacity;
						} else {
							return false;
						}
					default:
						return false;
				}
			}
		});

		if (transportToTarget(creep, target)) {
			creep.memory.transferredTo = {
				type: 'spawn',
				pos: _.clone(target.pos)
			};
			Counters.work(creep);
		} else {
			// now do containers, storage and towers
			target = <Structure>Hive.findBy(creep.pos, FIND_STRUCTURES, {
				filter: (st: Structure) => {
					switch (st.structureType) {
						case STRUCTURE_CONTAINER:
						case STRUCTURE_STORAGE:
							const con = <StructureContainer | StructureStorage>st;
							// Prevent creeps from depositing energy withdrawn
							// from a storage back into storage
							if (creep.memory.withdrewFrom) {
								if (creep.memory.withdrewFrom.type === 'storage') {
									return false;
								}
							}
							return con.store[RESOURCE_ENERGY] < con.storeCapacity;
						case STRUCTURE_TOWER:
							const tow = <StructureTower>st;
							return tow.energy < tow.energyCapacity;
						default:
							return false;
					}
				}
			});

			if (transportToTarget(creep, target)) {
				creep.memory.transferredTo = {
					type: (target.structureType === STRUCTURE_CONTAINER ?
						'storage' :
						(target.structureType === STRUCTURE_STORAGE ? 'storage' : 'tower')),
					pos: _.clone(target.pos)
				};
				Counters.work(creep);
			} else {
				IdleAction.run(creep);
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
