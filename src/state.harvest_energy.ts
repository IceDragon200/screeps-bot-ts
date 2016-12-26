namespace HarvestEnergyStep {
	export function run(creep: Creep) {
		if (creep.carry.energy < creep.carryCapacity) {
			const source = <Source>creep.pos.findClosestByPath(FIND_SOURCES, {
				ignoreCreeps: false
			});
			if (source) {
				if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
					creep.moveTo(source);
				}
				creep.memory.idle = 0;
			} else {
				creep.say("sleeping");
				creep.memory.sleeping = 5;
				creep.memory.idle++;
			}
		}
	}
}

export default HarvestEnergyStep;
