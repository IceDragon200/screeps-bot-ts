import {ExtendedRoomPosition} from "./__types__";
import Counters from "./counters";

namespace RoleCommons {
	export const ERR_NO_ROUTE: number = -100;

	export function canMove(creep: Creep): boolean {
		return creep.fatigue <= 0;
	}

	export function castRoomPosition(pos): RoomPosition {
		if (pos instanceof RoomPosition) {
			return pos;
		}
		return new RoomPosition(pos.x, pos.y, pos.roomName);
	}

	export function isOnEdgeOfRoom(creep: Creep) {
		const x = creep.pos.x;
		const y = creep.pos.y;
		if (x === 49 || x === 0 || y === 49 || y === 0) {
			return true;
		}
		return false;
	}

	export function isInRoom(creep: Creep, pos) {
		return creep.pos.roomName === pos.roomName;
	}

	export function moveIntoRoom(creep: Creep, pos) {
		const x = creep.pos.x;
		const y = creep.pos.y;

		if (pos.roomName === creep.pos.roomName) {
			if (x <= 0 && y < 49) {
				return creep.move(RIGHT);
			} else if (x >= 49 && y < 49) {
				return creep.move(LEFT);
			} else if (y >= 49 && x < 49) {
				return creep.move(TOP);
			} else if (y <= 0 && x < 49) {
				return creep.move(BOTTOM);
			}
		} else {
			if (x <= 0 && y < 49) {
				return creep.move(LEFT);
			} else if (x >= 49 && y < 49) {
				return creep.move(RIGHT);
			} else if (y >= 49 && x < 49) {
				return creep.move(BOTTOM);
			} else if (y <= 0 && x < 49) {
				return creep.move(TOP);
			} else {
				return creep.moveTo(castRoomPosition(pos));
			}
		}
		return null;
	}

	/**
	 * A specialized function for handling move between room actions
	 */
	export function moveToRoom(creep: Creep, pos) {
		const roomPos = castRoomPosition(pos);

		console.log(moveIntoRoom(creep, roomPos));
		//if (isOnEdgeOfRoom(creep)) {
		//	//if (isInRoom(creep, pos)) {
		//	//	console.log("Is on edge of target room");
		//	//} else {
		//	//	console.log("Is on edge of external room");
		//	//}
		//	return;
		//}
	}

	export function steppedInsideRoom(creep: Creep, target) {
		if (target.roomName !== creep.pos.roomName) {
			return false;
		} else {
			console.log("Now inside room");
		}

		return !isOnEdgeOfRoom(creep);
	}

	export function moveToRoute(creep: Creep, route) {
		const target = <RoomObject>creep.pos.findClosestByRange(route.exit);
		if (target) {
			return creep.moveTo(target);
		}
		return ERR_NO_ROUTE;
	}
}

export default RoleCommons;
