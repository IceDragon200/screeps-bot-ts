import * as _ from "lodash";
import Hive from "./hive";
import CartographyRepo from "./repo.cartography";

/**
 * The CreepRegistrar handles creep death and logging surveying
 * information upon death (The hive must live on!)
 */
namespace CreepRegistrar {
	export function updateAllByRole(role: string, cb: (creep: Creep) => void) {
		for (let name in Game.creeps) {
			const creep: Creep = Game.creeps[name];
			if (creep) {
				if (creep.memory.role === role) {
					cb(creep);
				}
			}
		}
	}

	export function groupCreepsByRole(): Hive.ICreepsByRole {
		const creepsByRole: Hive.ICreepsByRole = {};
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

	export function prioritizedRoles(roles: string[], creepsByRole: Hive.ICreepsByRole): string[] {
		return _.sortBy(_.clone(roles), (role: string) => {
			return creepsByRole[role].length;
		});
	}

	export function neededRole(creepsByRole: Hive.ICreepsByRole, oldRole: string) {
		const roles = prioritizedRoles(Hive.Roles, creepsByRole);
		for (let i in roles) {
			const role = roles[i];
			if (role === "idler") continue;

			let [mn, mx] = Hive.PopulationCap[role];
			if (creepsByRole[role].length < mn) {
				return role;
			} else {
				if (creepsByRole[role].length < mx) {
					if (oldRole === 'idler' || creepsByRole[oldRole].length > mn) {
						return role;
					}
				}
			}
		}
		return oldRole;
	}

	/**
	 * Cleans up any dead creeps,
	 * Organizes the creeps by their role and then reassigns idling creeps to new
	 * jobs
	 */
	export function roleCall() {
		const creepsByRole = groupCreepsByRole();

		for (let name in Game.creeps) {
			const creep = Game.creeps[name];

			let canChange = creep.memory.role === 'idler';

			if (!canChange && Hive.roleChanges) {
				canChange = creep.memory.idle > Hive.idleLimit;
			}

			if (canChange) {
				const oldRole: string = creep.memory.role;
				creep.memory.role = neededRole(creepsByRole, oldRole);

				if (oldRole !== creep.memory.role) {
					console.log(`Promoted from '${oldRole}' to '${creep.memory.role}'`);
					creep.say(creep.memory.role);
					creepsByRole[oldRole] = _.reject(creepsByRole[oldRole], (c) => {
						return c.id === creep.id;
					});
					creepsByRole[creep.memory.role].push(creep);
				}
			}
		}
		return creepsByRole;
	}

	/**
	 * Logs the creeps by their role to the console for debugging
	 */
	export function reportCreepsByRole(creepsByRole: Hive.ICreepsByRole) {
		Hive.Roles.forEach(function(role) {
			const [mn, mx] = Hive.PopulationCap[role];
			console.log(`Workers available ${role}: ${creepsByRole[role].length} / ${mn} / ${mx}`);
		});
	}

	export function run() {
		if (Memory['creep_registrar'] === undefined) {
			Memory['creep_registrar'] = {
				timer: 0
			};
		}
		const reg = Memory['creep_registrar'];
		if (--reg.timer < 0) {
			for (let name in Memory['creeps']) {
				if (!Game.creeps[name]) {
					CartographyRepo.log(Memory['creeps'][name]);
					delete Memory['creeps'][name];
					console.log(`Buried ${name}`);
				}
			}
			reg.timer = 60;
		}
	}
}

export default CreepRegistrar;
