import Hive from './hive';
import ActionQueue from "./action_queue";
import Counters from "./counters";

// Roles
import ArcherRole from './role.archer';
import BuilderRole from './role.builder';
import ClaimerRole from './role.claimer';
import FighterRole from './role.fighter';
import HarvesterRole from './role.harvester';
import MinerRole from './role.miner';
import RepairerRole from './role.repairer';
import SurveyorRole from './role.surveyor';
import TransporterRole from './role.transporter';
import UpgraderRole from './role.upgrader';
import RoleCommons from "./role_commons";

namespace RoleExecutor {
	function handleRecycle(creep: Creep): boolean {
		if (creep.memory.recycle) {
			const pos = new RoomPosition(creep.memory.home.x, creep.memory.home.y, creep.memory.home.roomName);
			if (creep.pos.getRangeTo(pos) < 2) {
				Counters.sleep(creep, 3);
			} else {
				creep.moveTo(pos);
			}
			return true;
		}
		return false;
	}

	function handleRemote(creep: Creep): boolean {
		if (creep.memory.remote) {
			const remote = creep.memory.remote;
			if (creep.pos.roomName !== remote.room)  {
				const flag = Game.flags[remote.flag];
				if (flag) {
					creep.moveTo(flag);
					return true;
				}
			}
		}
		return false;
	}

	function handleActions(creep: Creep): boolean {
		let acted = ActionQueue.ActionResult.REJECT;
		if (ActionQueue.hasQueued(creep.memory.actions)) {
			[acted, creep.memory.actions] = ActionQueue.complete(creep.memory.actions, function(action) {
				switch (action.name) {
					case 'moveto': {
						const point = action.params[0];
						const pos = new RoomPosition(point.x, point.y, point.roomName);
						if (creep.pos.getRangeTo(pos) < 2) {
							return ActionQueue.ActionResult.OK;
						} else {
							switch (creep.moveTo(pos, {reusePath: 10})) {
								case OK:
									break;
							}
							return ActionQueue.ActionResult.WORKING;
						}
					}
					default:
						return ActionQueue.ActionResult.REJECT;
				}
			});
		}
		switch (acted) {
			case ActionQueue.ActionResult.REJECT:
			case ActionQueue.ActionResult.OK:
				return false;
			case ActionQueue.ActionResult.WORKING:
				return true;
		}
	}

	export function run(creep: Creep, env) {
		if (!creep.spawning) {
			if (handleRecycle(creep)) {
				return;
			}

			if (handleActions(creep)) {
				return;
			}

			if (handleRemote(creep)) {
				return;
			}

			switch (creep.memory.behaviour || creep.memory.role) {
				// Army
				case 'fighter':
					FighterRole.run(creep, env);
					break;
				case 'archer':
					ArcherRole.run(creep, env);
					break;
				// Economy
				case 'builder':
					BuilderRole.run(creep, env);
					break;
				case 'claimer':
					ClaimerRole.run(creep, env);
					break;
				case 'harvester':
					HarvesterRole.run(creep, env);
					break;
				case 'transporter_s2':
				case 'transporter':
					TransporterRole.run(creep, env);
					break;
				case 'miner':
					MinerRole.run(creep, env);
					break;
				case 'upgrader':
					UpgraderRole.run(creep, env);
					break;
				case 'repairer':
					RepairerRole.run(creep, env);
					break;
				case 'surveyor':
					SurveyorRole.run(creep, env);
					break;
				default:
					Counters.idle(creep);
					break;
			}
		}
	}
}

export default RoleExecutor;
