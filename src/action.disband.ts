import Counters from "./counters";

namespace DisbandAction {
	export function run(creep: Creep) {
		creep.memory.recycle = true;
		const pos = new RoomPosition(
			creep.memory.home.x,
			creep.memory.home.y,
			creep.memory.home.roomName);

		switch (creep.moveTo(pos)) {
			case OK:
				break;
			default:
		}

		Counters.work(creep);
	}
}

export default DisbandAction;
