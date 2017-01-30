import * as _ from "lodash";

namespace RegenAction {
	export function run(creep: Creep) {
		if (_.includes(<any[]>creep.body, (part) => { return part.type === HEAL; })) {
			if (creep.hits < creep.hitsMax) {
				creep.heal(creep);
				return true;
			}
		}
		return false;
	}
}

export default RegenAction;
