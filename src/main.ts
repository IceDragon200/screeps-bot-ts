import * as _ from "lodash";
import "./prototype";
import Hive from './hive';
import Counters from "./counters";
// Roles
import ArcherRole from './role.archer';
import BuilderRole from './role.builder';
import CartographyRepo from './repo.cartography';
import ClaimerRole from './role.claimer';
import FighterRole from './role.fighter';
import HarvesterRole from './role.harvester';
import MinerRole from './role.miner';
import RepairerRole from './role.repairer';
import Supervisor from './supervisor';
import SurveyorRole from './role.surveyor';
import TransporterRole from './role.transporter';
import UpgraderRole from './role.upgrader';

const ver = "1.0.0";

namespace Main {
	export function initCreepHome(creep: Creep) {
		if (!creep.memory.home) {
			const spawns = <StructureSpawn[]>creep.room.find(FIND_STRUCTURES, {
				filter: (sp: Structure) => {
					return sp.structureType === STRUCTURE_SPAWN;
				}
			});
			if (spawns.length > 0) {
				creep.memory.home = _.clone(spawns[0].pos);
			} else {
				creep.memory.home = _.clone(creep.pos);
			}
			console.log(`Initialized ${creep.name}'s home`);
		}
	}

	export function loop() {
		CartographyRepo.run();
		Supervisor.run();

		for (let name in Game.creeps) {
			const creep = Game.creeps[name];

			initCreepHome(creep);

			if (!creep.spawning && Counters.processSleep(creep)) {
				switch (creep.memory.behaviour || creep.memory.role) {
					// Army
					case 'fighter':
						FootmanRole.run(creep);
						break;
					case 'archer':
						ArcherRole.run(creep);
						break;
					// Economy
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
	}
}

export const loop = Main.loop;
