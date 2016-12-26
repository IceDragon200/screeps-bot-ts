import HarvesterRole from './role.harvester';
import UpgraderRole from './role.upgrader';
import BuilderRole from './role.builder';
import RepairerRole from './role.repairer';
import Supervisor from './supervisor';
import Hive from './hive';

const ver = "1.0.0";

export const loop = function() {
  Supervisor.run();

  for (let name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.idle === undefined) {
      creep.memory.idle = 0;
    }

    if (creep.memory.sleeping === undefined) {
      creep.memory.sleeping = 0;
    }

    if (creep.memory.sleeping <= 0) {
      switch (creep.memory.role) {
        case 'harvester':
          HarvesterRole.run(creep);
          break;
        case 'upgrader':
          UpgraderRole.run(creep);
          break;
        case 'builder':
          BuilderRole.run(creep);
          break;
        case 'repairer':
          RepairerRole.run(creep);
          break;
        default:
          creep.memory.idle++;
          break;
      }
      if (Hive.sleepy && creep.memory.idle > 5) {
        creep.memory.sleeping = 5;
      }
    } else {
      creep.memory.sleeping--;
    }

    if (creep.memory.idle >= Hive.idleLimit) {
      if (creep.memory.role !== 'idler') {
        creep.memory.role = 'idler';
        console.log(`${creep.memory.role} is now an idler`);
      }
      creep.say("idling");
    }
  }
};
