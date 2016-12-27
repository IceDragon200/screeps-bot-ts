import Hive from "./hive";

namespace TransportEnergyState {
	export function run(creep: Creep, currentState, nextState) {
		const target = <Structure>Hive.findBy(creep.pos, FIND_STRUCTURES, {
			filter: (st: Structure) => {
				switch (st.structureType) {
					case STRUCTURE_CONTAINER:
					case STRUCTURE_STORAGE:
						const con = <StructureContainer | StructureStorage>st;
						return con.store[RESOURCE_ENERGY] < con.storeCapacity;
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
		if (target) {
			switch (creep.transfer(target, RESOURCE_ENERGY)) {
				case OK:
					creep.say("filling");
					break;
				case ERR_FULL:
					creep.say("its full");
					break;
				case ERR_NOT_IN_RANGE:
					creep.moveTo(target);
					break;
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

		if (creep.carry.energy <= 0) {
			creep.say('need en');
			return nextState;
		}
		return currentState;
	}
}

export default TransportEnergyState;
