import HarvestEnergyStep from "./state.harvest_energy";

namespace BuilderRole {
  /**
   * @param {Creep} creep
   */
  export function run(creep: Creep) {
    delete creep.memory.target;

    if (creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
      creep.say('harvesting');
    }

    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
      creep.say('building');
    }

    if (creep.memory.building) {
      const target = <ConstructionSite>creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
        ignoreCreeps: false
      });

      if (target) {
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        creep.memory.idle = 0;
      } else {
        creep.memory.sleeping = 5;
        creep.memory.idle++;
      }
    } else {
      HarvestEnergyStep.run(creep);
    }
  }
};

export default BuilderRole;
