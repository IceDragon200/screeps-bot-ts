import {ExtendedRoom} from "./__types__";
import * as _ from "lodash";
import Counters from "./counters";
import Hive from "./hive";
import IdleAction from "./action.idle";
import RoleCommons from "./role_commons";

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
					creep.moveTo(target, {reusePath: 10});
					break;
			}
			return true;
		} else {
			return false;
		}
	}

	const STRUCTURE_WEIGHTS = {};
	STRUCTURE_WEIGHTS[STRUCTURE_SPAWN] = 1;
	STRUCTURE_WEIGHTS[STRUCTURE_EXTENSION] = 2;
	STRUCTURE_WEIGHTS[STRUCTURE_CONTAINER] = 3;
	STRUCTURE_WEIGHTS[STRUCTURE_STORAGE] = 4;
	STRUCTURE_WEIGHTS[STRUCTURE_TOWER] = 10;

	function findAndWeighStructures(creep: Creep): Structure[] {
		const room = <ExtendedRoom>Game.rooms[creep.memory.home.roomName];
		if (!room) {
			return [];
		}

		let structures = room.findStructuresAndWeigh(STRUCTURE_WEIGHTS, {
			filter: function(st) {
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
			},
			sortBy: function(st) {
				switch (st.structureType) {
					case STRUCTURE_CONTAINER:
					case STRUCTURE_STORAGE:
						const con = <StructureContainer | StructureStorage>st;
						return con.store[RESOURCE_ENERGY];
					case STRUCTURE_TOWER:
					case STRUCTURE_EXTENSION:
					case STRUCTURE_SPAWN:
						const sp = <StructureSpawn | StructureExtension | StructureTower>st;
						return sp.energy < sp.energyCapacity;
					default:
						return 0;
				}
			}
		});
		return structures;
	}

	function determineLocalTransferTarget(creep: Creep) {
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

		if (!target) {
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
		}

		if (target) {
			creep.memory.transferTarget = _.clone(target.pos);
		} else {
			creep.memory.transferTarget = null;
		}
	}

	function determineTransferTarget(creep: Creep) {
		return determineLocalTransferTarget(creep);
	}

	function structureToTransferType(structure: Structure) {
		switch (structure.structureType) {
			case STRUCTURE_SPAWN:
			case STRUCTURE_EXTENSION:
				return 'spawn';
			case STRUCTURE_CONTAINER:
			case STRUCTURE_STORAGE:
				return 'storage';
			case STRUCTURE_TOWER:
				return 'tower';
		}

		return 'structure';
	}

	export function run(creep: Creep, currentState: string, nextState: string) {
		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}

		// Give up on trying to transport back to home.
		/*if (creep.memory.remote) {
			const pos = new RoomPosition(creep.memory.home.x, creep.memory.home.y, creep.memory.home.roomName);
			//if (!RoleCommons.steppedInsideRoom(creep, creep.memory.home)) {
				RoleCommons.moveToRoom(creep, pos);
				return currentState;
			//}
		}*/

		if (!creep.memory.transferTarget) {
			determineTransferTarget(creep);
		}

		if (creep.memory.transferTarget) {
			const t = creep.memory.transferTarget;
			const pos = new RoomPosition(t.x, t.y, t.roomName);
			const results = creep.room.lookAt(pos);
			const target = _.find(results, (r) => {
				if (r.structure) {
					switch (r.structure.structureType) {
						case STRUCTURE_SPAWN:
						case STRUCTURE_EXTENSION:
						case STRUCTURE_TOWER:
							const st = <StructureTower | StructureExtension | StructureSpawn>r.structure;
							return st.energy < st.energyCapacity;
						case STRUCTURE_CONTAINER:
						case STRUCTURE_STORAGE:
							const con = <StructureContainer | StructureStorage>r.structure;
							return con.store[RESOURCE_ENERGY] < con.storeCapacity;
					}
				}
				return false;
			});
			if (target) {
				if (transportToTarget(creep, target.structure)) {
					creep.memory.transferredTo = {
						type: structureToTransferType(target.structure),
						pos: _.clone(target.structure.pos)
					};
					Counters.work(creep);
				} else {
					IdleAction.run(creep);
				}
			} else {
				creep.memory.transferTarget = null;
			}
		} else {
			IdleAction.run(creep);
		}


		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}
		return currentState;
	}
}

export default TransportEnergyState;
