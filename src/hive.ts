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
	export const Roles = ['miner', 'transporter', 'upgrader', 'builder', 'repairer'];

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

	export function findBy(obj: RoomPosition, ...rest) {
		return obj.findClosestByPath.apply(obj, rest);
		//return obj.findClosestByRange.apply(obj, rest);
	}

	export function creepBurial() {
		if (--Memory['gcTimer'] < 0) {
			for (let name in Memory['creeps']) {
				if (!Game.creeps[name]) {
					delete Memory['creeps'][name];
					console.log(`Buried ${name}`);
				}
			}
			Memory['gcTimer'] = 60;
		}
	}

	export function updateAllByRole(role, cb) {
		for (let name in Game.creeps) {
			const creep: Creep = Game.creeps[name];
			if (creep) {
				if (creep.memory.role === role) {
					cb(creep);
				}
			}
		}
	}

	export function groupCreepsByRole(): ICreepsByRole {
		const creepsByRole: ICreepsByRole = {};
		Hive.Roles.forEach(function(role) {
			creepsByRole[role] = [];
		});

		for (let name in Game.creeps) {
			const creep = Game.creeps[name];
			const role = creep.memory.role;
			if (!creepsByRole[role]) {
				creepsByRole[role] = [];
			}
			creepsByRole[role].push(creep);
		}
		return creepsByRole;
	}

	export function reportCreepsByRole(creepsByRole) {
		Roles.forEach(function(role) {
			const [mn, mx] = PopulationCap[role];
			console.log(`Workers available ${role}: ${creepsByRole[role].length} / ${mn} / ${mx}`);
		});
	}

	export function prioritizedRoles(roles: string[], creepsByRole: ICreepsByRole): string[] {
		return _.sortBy(_.clone(roles), (role: string) => {
			return creepsByRole[role].length;
		});
	}
}

export default Hive;
