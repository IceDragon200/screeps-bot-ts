import * as _ from "lodash";
import Hive from "./hive";
import Counters from "./counters";

namespace IdleState {
	export function run(creep: Creep) {
		if (Counters.idle(creep).memory.idle >= Hive.idleLimit) {
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
						Counters.sleep(creep, 3);
						break;
				}
			}
			return true;
		}
		return false;
	}
}

export default IdleState;
