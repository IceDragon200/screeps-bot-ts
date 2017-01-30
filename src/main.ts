import * as _ from "lodash";
import "./prototype";
import Hive from './hive';
import Counters from "./counters";
import RoleExecutor from './role_executor';
import CartographyRepo from './repo.cartography';
import Supervisor from './supervisor';

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
		const env = {
			creepsByRole: {}
		};
		CartographyRepo.run(env);
		Supervisor.run(env);

		for (let name in Game.creeps) {
			const creep = Game.creeps[name];

			if (Counters.processSleep(creep)) {
				initCreepHome(creep);

				RoleExecutor.run(creep, env);

				if (Hive.sleepy && !Counters.isSleeping(creep)) {
					Counters.sleep(creep, 1 + Math.floor(2 * Math.random()));
				}
			}
			/*if (creep.memory.idle >= Hive.idleLimit) {
				//if (creep.memory.role !== 'idler') {
					//creep.memory.role = 'idler';
					//console.log(`${creep.memory.role} is now an idler`);
				//}
				creep.say("idling");
			}*/
		}
	}
}

export const loop = Main.loop;
