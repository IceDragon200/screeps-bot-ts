import HarvestEnergyStep from "./state.harvest_energy";

namespace HarvesterRole {
	/** @param {Creep} creep **/
	export function run(creep: Creep) {
		if (creep.carry.energy < creep.carryCapacity) {
			HarvestEnergyStep.run(creep);
		} else {
			const targets = <(StructureExtension | Spawn)[]>creep.room.find(FIND_STRUCTURES, {
				filter: (st) => {
					switch (st.structureType) {
						case STRUCTURE_EXTENSION:
						case STRUCTURE_SPAWN:
							return st.energy < st.energyCapacity;
						default:
							return false;
					}
				}
			});
			if (targets.length > 0) {
				let target = targets[0];
				targets.forEach((t) => {
					if (t.energy < target.energy) {
						target = t;
					}
				});
				if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
					creep.moveTo(target);
				}
				creep.memory.idle = 0;
			} else {
				if (creep.memory.idle++ > 20) {
					const flags = _.filter(Game.flags, (f) => {
						return f.name === "idlers.corner";
					});

					if (flags.length > 0) {
						console.log("Moving to idlers corner");
						creep.moveTo(flags[0]);
					}
				}
			}
		}
	}
};

export default HarvesterRole;
