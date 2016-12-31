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
import Counters from "./counters";
import Hive from './hive';

const ver = "1.0.0";

export const loop = function() {
	CartographyRepo.run();
	Supervisor.run();

	for (let name in Game.creeps) {
		const creep = Game.creeps[name];

		if (Counters.processSleep(creep)) {
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
				case 'transporter_s2':
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
					Counters.idle(creep);
					break;
			}
			if (Hive.sleepy && creep.memory.idle > 5) {
				Counters.sleep(creep, 3);
			}
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
