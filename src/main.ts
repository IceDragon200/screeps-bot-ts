import "./prototype";
import BuilderRole from './role.builder';
import ClaimerRole from './role.claimer';
import HarvesterRole from './role.harvester';
import MinerRole from './role.miner';
import RepairerRole from './role.repairer';
import SurveyorRole from './role.surveyor';
import TransporterRole from './role.transporter';
import UpgraderRole from './role.upgrader';
import Supervisor from './supervisor';
import CartographyRepo from './repo.cartography';
import Hive from './hive';

const ver = "1.0.0";

export const loop = function() {
	CartographyRepo.run();
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
				case 'builder':
					BuilderRole.run(creep);
					break;
				case 'claimer':
					ClaimerRole.run(creep);
					break;
				case 'harvester':
					HarvesterRole.run(creep);
					break;
				case 'transporter':
					TransporterRole.run(creep);
					break;
				case 'miner':
					MinerRole.run(creep);
					break;
				case 'upgrader':
					UpgraderRole.run(creep);
					break;
				case 'repairer':
					RepairerRole.run(creep);
					break;
				case 'surveyor':
					SurveyorRole.run(creep);
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
			//if (creep.memory.role !== 'idler') {
				//creep.memory.role = 'idler';
				//console.log(`${creep.memory.role} is now an idler`);
			//}
			creep.say("idling");
		}
	}
};
