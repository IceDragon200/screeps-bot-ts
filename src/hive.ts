namespace Hive {
	export const debug = false;
	export const sleepy = false;

	export const idleLimit = 20;
	export const PopulationCap = {
		harvester: [6, 12],
		upgrader: [3, 9],
		builder: [6, 12],
		repairer: [2, 6],
		idler: [1, 1]
	};
	export const Roles = ['harvester', 'upgrader', 'builder', 'repairer', 'idler'];

	export const RoleWeight = {
		harvester: 10,
		upgrader: 5,
		builder: 3,
		repairer: 2,
		idler: 1
	};

	export const basicWorker = [WORK, MOVE, CARRY];
	export const fastWorker = [WORK, MOVE, MOVE, CARRY];
	export const superHarvester = [WORK, WORK, MOVE, MOVE, CARRY];

	export const GenomesByRole = {
		harvester: [
			basicWorker,
			superHarvester
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
