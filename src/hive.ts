/// <reference path="../typings/globals/screeps/index.d.ts" />

/**
 * Configuration and Utility module
 */
namespace Hive {
	export type ICreepsByRole = {[role: string]: Creep[]};

	// Print some debug information
	export const debug = false;

	// All creeps will sleep for 5 ticks before doing anything
	export const sleepy = false;

	// Miners will dump their carry contents (if they have a carry) immediately
	export const sloppyMiners = false;

	// Should roles be reassigned dynamically when idling?
	export const roleChanges = true;

	// How long does a creep have to idle, before it's considered dormant?
	export const idleLimit = 20;

	export const PopulationCap: {[name: string]: [number, number]} = {
		//harvester: [0, 2],
		miner: [6, 9],
		transporter: [4, 6],
		upgrader: [3, 9],
		builder: [6, 12],
		repairer: [2, 6],
		idler: [1, 1]
	};
	export const AllRoles = Object.keys(PopulationCap);
	export const Roles = ['miner', 'transporter', 'upgrader', 'builder', 'repairer', 'transporter_s2'];

	export const RoleWeight = {
		miner: 10,
		transporter: 8,
		upgrader: 5,
		builder: 3,
		repairer: 2,
		idler: 1,
		harvester: 0
	};

	export const basicWorker = {parts: [WORK, MOVE, CARRY]};
	export const fastWorker = {parts: [WORK, MOVE, MOVE, CARRY]};
	export const superHarvester = {parts: [WORK, WORK, MOVE, MOVE, CARRY]};

	export const GenomesByRole = {
		harvester: [
			basicWorker,
			superHarvester
		],
		miner: [
			{parts: [MOVE, WORK, WORK]}
		],
		transporter: [
			{parts: [MOVE, MOVE, CARRY]}
		],
		transporter_s2: [
			{
				parts: [MOVE, MOVE, CARRY],
				memory: {
					pickupPriority: ['stored_energy', 'dropped_energy']
				}
			}
		],
		upgrader: [
			basicWorker
		],
		builder: [
			basicWorker
		],
		repairer: [
			fastWorker
		],
		claimer: [
			{parts: [MOVE, CLAIM]}
		],
		surveyor: [
			{parts: [MOVE, MOVE]}
		],
		idler: [
			basicWorker
		]
	};

	export function findBy(obj: RoomPosition, ...rest) {
		return obj.findClosestByPath.apply(obj, rest);
		//return obj.findClosestByRange.apply(obj, rest);
	}
}

export default Hive;
