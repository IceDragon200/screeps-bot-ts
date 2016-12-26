namespace UpgraderRole {
    /** @param {Creep} creep **/
    export function run(creep) {
      if (creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
        creep.say('harvesting');
      }

      if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true;
        creep.say('upgrading');
      }

      if (creep.memory.upgrading) {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
        creep.memory.idle = 0;
      } else {
        const source = creep.pos.findClosestByPath(FIND_SOURCES);
        if (source) {
          if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
          }
          creep.memory.idle = 0;
        } else {
          creep.memory.idle++;
        }
      }
  }
};

export default UpgraderRole;
