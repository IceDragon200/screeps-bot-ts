import Hive from "./hive";
import CreepMind from "./creep_mind";
import * as _ from "lodash";

namespace IdleState {
	export function run(creep: Creep) {
		if (CreepMind.idle(creep).memory.idle >= Hive.idleLimit) {
			const flags = _.filter(Game.flags, (f) => {
				return f.name === "idlers.corner";
			});

			if (flags.length > 0) {
				console.log("Moving to idlers corner");
				switch (creep.moveTo(flags[0])) {
					case OK:
						break;
					case ERR_TIRED:
					case ERR_NO_PATH:
						CreepMind.sleep(creep, 3);
						break;
				}
			}
			return true;
		}
		return false;
	}
}

export default IdleState;
