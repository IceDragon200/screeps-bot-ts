/// <reference path="../typings/globals/screeps/index.d.ts" />

import * as _ from "lodash";
import {ExtendedSpawn, ExtendedFlag} from "./__types__";

/**
 * Configuration and Utility module
 */
namespace Hive {
	export interface ObjectMap<T> {
		[key: string]: T;
	}

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
		transporter_s2: [4, 6],
		upgrader: [3, 9],
		builder: [6, 12],
		repairer: [2, 6],
		idler: [1, 1]
	};
	export const AllRoles = Object.keys(PopulationCap);
	export const Roles = ['miner', 'transporter', 'upgrader', 'builder', 'repairer', 'transporter_s2'];

	export function calculateTotalCost(parts: string[]): number {
		return parts.reduce(function(cost, part) {
			return cost + BODYPART_COST[part] || 0;
		}, 0);
	}

	export function calculateEmptyWeight(parts: string[]): number {
		return _.reject(parts, (part) => {
			return part === MOVE || part === CARRY;
		}).length;
	}

	export function calculateFullWeight(parts: string[]): number {
		return _.reject(parts, (part) => {
			return part === MOVE;
		}).length;
	}

	export function calculateMaxHP(parts: string[]): number {
		return parts.length * 100;
	}

	export function calculateAttack(parts: string[], type: string): number {
		const count = _.filter(parts, (part) => {
			return part === type;
		}).length;
		if (type === ATTACK) {
			return count * 30;
		} else if (type === RANGED_ATTACK) {
			return count * 10;
		}
		return 0;
	}

	export const TERRAIN_FACTOR = {
		road: 0.5,
		plain: 1.0,
		swamp: 5.0,
	};

	interface RolePrefabConstructor {
		parts: string[];
		memory?: ObjectMap<any>;
	}

	export class RolePrefab {
		public parts: string[];
		public memory: ObjectMap<any> = {};
		public cost: number;
		public weightEmpty: number;
		public weightFull: number;
		public level: number;
		public role: string;
		public maxHp: number;
		public meleeAtk: number;
		public rangedAtk: number;

		constructor(opts: RolePrefabConstructor) {
			_.merge(this, opts);
			this.cost = calculateTotalCost(this.parts);
			this.weightEmpty = calculateEmptyWeight(this.parts);
			this.weightFull = calculateFullWeight(this.parts);
			this.maxHp = calculateMaxHP(this.parts);
			this.meleeAtk = calculateAttack(this.parts, ATTACK);
			this.rangedAtk = calculateAttack(this.parts, RANGED_ATTACK);
		}

		displayName(): string {
			return `${this.role}[${this.level}]`;
		}

		log(text: string) {
			console.log(`[${this.displayName()}] ${text}`);
		}

		canCarry(): boolean {
			return _.includes(this.parts, CARRY);
		}

		canMelee(): boolean {
			return _.includes(this.parts, ATTACK);
		}

		canRangeAttack(): boolean {
			return _.includes(this.parts, RANGED_ATTACK);
		}

		canAttack(): boolean {
			return this.canMelee() || this.canRangeAttack();
		}

		countMoveParts(): number {
			const moveParts = _.filter(this.parts, (part) => {
				return part === MOVE;
			});
			return moveParts.length;
		}

		calcFatigue(terrain: string, empty: boolean = true): number {
			const weight = empty ? this.weightEmpty : this.weightFull;
			const k = TERRAIN_FACTOR[terrain] || 0;
			return 2 * (weight * k - this.countMoveParts());
		}

		// Time-Between-Moves
		calcTBM(terrain: string, empty: boolean = true): number {
			const weight = empty ? this.weightEmpty : this.weightFull;
			const k = TERRAIN_FACTOR[terrain] || 0;
			return Math.ceil(k * weight / this.countMoveParts());
		}

		copy(): RolePrefab {
			return new RolePrefab({
				parts: this.parts,
				memory: _.clone(this.memory)
			});
		}

	}

	export function calculateFatigueTable(parts: string[]) {
		const plain = 0;
		const road = 0;
		const swamp = 0;

		return {
			plain,
			road,
			swamp,
		};
	}

	export const basicWorker = new RolePrefab({
		parts: [WORK, MOVE, CARRY, MOVE],
		memory: {
			pickupPriority: ['stored_energy', 'dropped_energy']
		}
	});
	export const superHarvester = new RolePrefab({
		parts: [WORK, MOVE, WORK, CARRY, MOVE]
	});

	export const GenomesByRole: ObjectMap<Array<RolePrefab>> = {
		harvester: [
			basicWorker.copy(),
			superHarvester.copy()
		],
		miner: [
			new RolePrefab({parts: [WORK, WORK, CARRY, MOVE]}),
			new RolePrefab({parts: [WORK, MOVE, WORK, WORK, CARRY, MOVE]})
		],
		transporter: [
			new RolePrefab({parts: [MOVE, CARRY, MOVE]}),
			new RolePrefab({parts: [MOVE, CARRY, MOVE, CARRY, CARRY, MOVE]})
		],
		transporter_s2: [
			new RolePrefab({
				parts: [MOVE, CARRY, MOVE],
				memory: {
					pickupPriority: ['stored_energy', 'dropped_energy'],
					behaviour: 'transporter',
					solo: true
				}
			}),
			new RolePrefab({
				parts: [MOVE, CARRY, MOVE, CARRY, CARRY, MOVE],
				memory: {
					pickupPriority: ['stored_energy', 'dropped_energy'],
					behaviour: 'transporter',
					solo: true
				}
			})
		],
		upgrader: [
			basicWorker.copy(),
			new RolePrefab({
				parts: [MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE, MOVE],
				memory: {
					pickupPriority: ['stored_energy', 'dropped_energy']
				}
			}),
			new RolePrefab({
				parts: [MOVE, WORK, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE, MOVE],
				memory: {
					pickupPriority: ['stored_energy', 'dropped_energy']
				}
			})
		],
		builder: [
			basicWorker.copy(),
			new RolePrefab({
				parts: [MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE, MOVE],
				memory: {
					pickupPriority: ['stored_energy', 'dropped_energy']
				}
			})
		],
		repairer: [
			basicWorker.copy(),
			new RolePrefab({
				parts: [MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE, MOVE],
				memory: {
					pickupPriority: ['stored_energy', 'dropped_energy']
				}
			})
		],
		claimer: [
			new RolePrefab({parts: [MOVE, CLAIM]})
		],
		surveyor: [
			new RolePrefab({
				parts: [MOVE, MOVE, TOUGH]
			})
		],
		// A role that remains near the spawner to heal units
		home_medic: [
			new RolePrefab({
				parts: [MOVE, HEAL],
				memory: {
					tag: 'eco'
				}
			}),
			new RolePrefab({
				parts: [MOVE, MOVE, HEAL, HEAL],
				memory: {
					tag: 'eco'
				}
			}),
		],
		// A role that is used in the defenses
		field_medic: [
			new RolePrefab({
				parts: [MOVE, HEAL],
				memory: {
					tag: 'army'
				}
			}),
			new RolePrefab({
				parts: [MOVE, MOVE, HEAL, HEAL],
				memory: {
					tag: 'army'
				}
			}),
		],
		fighter: [
			new RolePrefab({
				parts: [TOUGH, TOUGH, ATTACK, MOVE, MOVE],
				memory: {
					tag: 'army'
				}
			}),
			new RolePrefab({
				parts: [TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE],
				memory: {
					tag: 'army'
				}
			})
		],
		archer: [
			new RolePrefab({
				parts: [TOUGH, RANGED_ATTACK, MOVE, MOVE],
				memory: {
					tag: 'army'
				}
			}),
			new RolePrefab({
				parts: [TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE],
				memory: {
					tag: 'army'
				}
			})
		],
		brute: [
			new RolePrefab({
				parts: [TOUGH, ATTACK, ATTACK, ATTACK, MOVE],
				memory: {
					tag: 'army',
					behaviour: 'fighter'
				}
			}),
			new RolePrefab({
				parts: [TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, MOVE, MOVE, HEAL],
				memory: {
					tag: 'army',
					behaviour: 'fighter'
				}
			}),
			new RolePrefab({
				parts: [TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, HEAL],
				memory: {
					tag: 'army',
					behaviour: 'fighter'
				}
			}),
		],
		idler: [
			basicWorker.copy()
		]
	};

	for (let role in Hive.GenomesByRole) {
		let prefabs = GenomesByRole[role];
		for (let i = 0; i < prefabs.length; ++i) {
			const prefab = prefabs[i];
			if (!prefab.role) {
				prefab.role = role;
			}
		}
		prefabs = GenomesByRole[role] = _.sortBy(prefabs, (prefab) => {
			return prefab.cost;
		});

		for (let i = 0; i < prefabs.length; ++i) {
			const prefab = prefabs[i];
			prefab.level = i;
		}
	}

	export function findBy(obj: RoomPosition, ...rest) {
		return obj.findClosestByPath.apply(obj, rest);
		//return obj.findClosestByRange.apply(obj, rest);
	}

	function displayRoleInformation(role) {
		const prefabs = GenomesByRole[role];
		if (prefabs) {
			for (let i = 0; i < prefabs.length; ++i) {
				const prefab = prefabs[i];
				prefab.log(`Cost: ${prefab.cost} EN`);
				prefab.log(`Level: ${prefab.level}`);
				prefab.log(`HP: ${prefab.maxHp}`);
				if (prefab.canCarry()) {
					prefab.log(`Weight (Empty): ${prefab.weightEmpty}`);
					prefab.log(`Weight (Full): ${prefab.weightFull}`);
				} else {
					prefab.log(`Weight: ${prefab.weightEmpty}`);
				}

				if (prefab.canMelee()) {
					prefab.log(`M.ATK: ${prefab.meleeAtk}`);
				}
				if (prefab.canRangeAttack()) {
					prefab.log(`R.ATK: ${prefab.rangedAtk}`);
				}

				prefab.log('Terrain Factors:');
				for (let terrainName in TERRAIN_FACTOR) {
					if (prefab.canCarry()) {
						const freqE = prefab.calcTBM(terrainName, true);
						const freqF = prefab.calcTBM(terrainName, false);
						const fatigueE = prefab.calcFatigue(terrainName, true);
						const fatigueF = prefab.calcFatigue(terrainName, false);
						prefab.log(`\t${terrainName} tbm=${freqE}/${freqF} fatigue=${fatigueE}/${fatigueF}`);
					} else {
						const freq = prefab.calcTBM(terrainName);
						const fatigue = prefab.calcFatigue(terrainName);
						prefab.log(`\t${terrainName} tbm=${freq} fatigue=${fatigue}`);
					}
				}
			}
		} else {
			console.log(`No such role ${role}`);
		}
	}

	export function displayRole(...roles: string[]) {
		roles.forEach((role) => {
			displayRoleInformation(role);
		});
	}

	export function eachAnchor(cb: (flag: Flag) => void) {
		for (let name in Game.flags) {
			const flag = Game.flags[name];
			if (flag && flag.memory.isAnchor) {
				cb(flag);
			}
		}
	}

	export interface RemotePoint {
		flag: string;
		room: string;
	}

	export interface ISpawnPoint {
		// is this an actual spawner?
		isSpawn: boolean;
		host: ExtendedSpawn | ExtendedFlag;
		spawner: ExtendedSpawn;
		memory: {
			remote?: RemotePoint
		}
	}

	export function eachSpawnPoint(cb: (point: ISpawnPoint) => void) {
		for (let name in Game.spawns) {
			const spawner = <ExtendedSpawn>Game.spawns[name];
			if (spawner) {
				cb({
					isSpawn: true,
					host: spawner,
					spawner: spawner,
					memory: {}
				});
			}
		}

		Hive.eachAnchor(function(flag: Flag) {
			if (!flag.memory.spawnName) {
				return;
			}

			const spawner = <ExtendedSpawn>Game.spawns[flag.memory.spawnName];
			if (!spawner) {
				flag.memory.spawnName = null;
				return;
			}

			cb({
				isSpawn: false,
				host: <ExtendedFlag>flag,
				spawner: spawner,
				memory: {
					remote: {
						flag: flag.name,
						room: flag.room.name
					}
				}
			});
		});
	}

	export function locateRole(role: string) {
		for (let name in Game.creeps) {
			const creep = Game.creeps[name];
			if (creep.memory.role === role) {
				console.log(`Located ${creep.name} at (${creep.pos.x}, ${creep.pos.y}) in ${creep.pos.roomName}`);
			}
		}
	}
}

export default Hive;
