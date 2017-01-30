import * as _ from "lodash";
import Hive from "./hive";
import CartographyRepo from "./repo.cartography";

/**
 * The CreepRegistrar handles creep death and logging surveying
 * information upon death (The hive must live on!)
 */
namespace CreepRegistrar {
	export function updateAllByRole(role: string, cb: (creep: Creep) => void) {
		let count = 0;
		for (let name in Game.creeps) {
			const creep: Creep = Game.creeps[name];
			if (creep) {
				if (creep.memory.role === role) {
					cb(creep);
					count += 1;
				}
			}
		}
		return count;
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
		let popCap = 0;
		for (let role in creepsByRole) {
			if (Hive.PopulationCap[role]) {
				const [mn, mx] = Hive.PopulationCap[role];
				console.log(`Workers available ${role}: ${creepsByRole[role].length} / ${mn} / ${mx}`);
			} else {
				console.log(`Workers available ${role}: ${creepsByRole[role].length}`);
			}
			popCap += creepsByRole[role].length;
		}
		console.log(`Population ${popCap}`);
		return popCap;
	}

	export function countRole(creepsByRole: Hive.ICreepsByRole, role: string): number {
		if (creepsByRole[role]) {
			return creepsByRole[role].length;
		}
		return 0;
	}

	export function countRoleInRoom(creepsByRole: Hive.ICreepsByRole, role: string, room: Room): number {
		return _.filter(creepsByRole[role], function(c) {
			if (c.memory.remote) {
				return c.memory.remote.room === room.name;
			} else {
				return c.room.name === room.name;
			}
		}).length;
	}

	export function hasEnoughOfRole(creepsByRole: Hive.ICreepsByRole, role: string, count: number): boolean {
		return countRole(creepsByRole, role) >= count;
	}

	export function hasEnoughOfRoleInRoom(creepsByRole: Hive.ICreepsByRole, role: string, count: number, room: Room): boolean {
		return countRoleInRoom(creepsByRole, role, room) >= count;
	}

	export function partnerWithCreep(a: Creep, b: Creep) {
		a.memory.partner = b.name;
		b.memory.partner = a.name;
		console.log(`${a.name} is now buddies with ${b.name}`);
		return true;
	}

	export function canPartner(creep: Creep) {
		return !creep.memory.solo;
	}

	export function creepInSameRemote(creep: Creep, other: Creep) {
		if (!creep.memory.remote && !other.memory.remote) {
			// neither has a remote, so they can partner
			return true;
		}

		if (creep.memory.remote && other.memory.remote) {
			return creep.memory.remote.room === other.memory.remote.room;
		}

		return false;
	}

	export function partnerWithRole(creepsByRole: Hive.ICreepsByRole, creep: Creep, role: string) {
		const creeps = creepsByRole[role];
		if (creeps) {
			const found = _.find(creeps, (other) => {
				return !other.memory.partner && canPartner(other) && creepInSameRemote(creep, other);
			});

			if (found) {
				partnerWithCreep(creep, found);
			}
		}
		return true;
	}

	function clearPartner(creep: Creep, reason) {
		console.log(`Clearing ${creep.name}'s partner, because ${reason}`);
		creep.memory.partner = null;
	}

	export function tryPartnerWithRole(creepsByRole: Hive.ICreepsByRole, creep: Creep, role: string) {
		if (!canPartner(creep)) {
			if (creep.memory.partner) {
				clearPartner(creep, "it cannot partner");
			}
			return false;
		}

		if (creep.memory.partner) {
			const other = Game.creeps[creep.memory.partner];
			// check if the creep exists
			if (other && canPartner(other)) {
				if (other.memory.partner) {
					// If the other creep has a partner, detect if it's the same as the current creep
					// or if the specified creep doesn't match the expected role
					if (other.memory.partner !== creep.name) {
						clearPartner(creep, "the other has a different partner");
					}

					if (other.memory.role !== role) {
						clearPartner(creep, `the other is not the expected role. expected ${role} (got ${other.memory.role})`);
					}

					if (!creepInSameRemote(creep, other))  {
						clearPartner(creep, `remotes do not match`);
					}
				} else {
					creep.memory.partner = null;
					if (other.memory.role === role && creepInSameRemote(creep, other)) {
						partnerWithCreep(creep, other);
					}
				}
			} else {
				// if not, erase the partner's name
				clearPartner(creep, "the other cannot partner");
			}
		}

		// now try to reassign a partner
		if (!creep.memory.partner) {
			partnerWithRole(creepsByRole, creep, role);
		}
		return true;
	}

	export function run(env) {
		if (Memory['creep_registrar'] === undefined) {
			Memory['creep_registrar'] = {
				timer: 0
			};
		}
		const reg = Memory['creep_registrar'];
		if (--reg.timer < 0) {
			for (let name in Memory['creeps']) {
				if (!Game.creeps[name]) {
					CartographyRepo.cancelCreepMemory(Memory['creeps'][name]);
					delete Memory['creeps'][name];
					console.log(`Buried ${name}`);
				}
			}
			reg.timer = 60;
		}
		return env;
	}
}

export default CreepRegistrar;
