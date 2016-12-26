namespace Hive {
	export const debug = false;
	export const sleepy = false;

	export const idleLimit = 20;
	export const PopulationCap = {
		harvester: [3, 5],
		upgrader: [3, 5],
		builder: [4, 10],
		idler: [1, 1]
	};
	export const Roles = ['harvester', 'upgrader', 'builder', 'idler'];

	export const RoleWeight = {
		harvester: 10,
		upgrader: 5,
		builder: 3,
		idler: 1
	};

	export const basicWorker = [WORK, MOVE, CARRY];
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
		idler: [
			basicWorker
		]
	};
};

export default Hive;
