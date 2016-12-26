namespace BuilderRole {
  /**
   * @param {Creep} creep
   */
  export function run(creep) {
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
      const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

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
      const source = creep.pos.findClosestByPath(FIND_SOURCES);
      if (source) {
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source);
        }
        creep.memory.idle = 0;
      } else {
        creep.memory.sleeping = 5;
        creep.memory.idle++;
      }
    }
  }
};

export default BuilderRole;
