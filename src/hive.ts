namespace Hive {
	export const debug = false;
	export const sleepy = false;

	export const idleLimit = 20;
	export const PopulationCap = {
		//harvester: [0, 2],
		miner: [9, 12],
		transporter: [9, 12],
		upgrader: [3, 9],
		builder: [6, 12],
		repairer: [2, 6],
		idler: [1, 1]
	};
	export const Roles = Object.keys(PopulationCap);

	export const RoleWeight = {
		miner: 10,
		transporter: 8,
		upgrader: 5,
		builder: 3,
		repairer: 2,
		idler: 1,
		harvester: 0
	};

	export const basicWorker = [WORK, MOVE, CARRY];
	export const fastWorker = [WORK, MOVE, MOVE, CARRY];
	export const superHarvester = [WORK, WORK, MOVE, MOVE, CARRY];

	export const GenomesByRole = {
		harvester: [
			basicWorker,
			superHarvester
		],
		miner: [
			[MOVE, WORK, WORK]
		],
		transporter: [
			[MOVE, MOVE, CARRY]
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
		idler: [
			basicWorker
		]
	};
};

export default Hive;
