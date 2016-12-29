import * as _ from "lodash";
import ClaimState from "./state.claim";
import CartographyRepo from "./repo.cartography";

namespace ClaimerRole {
	export function run(creep: Creep) {
		switch (creep.memory.state) {
			case 'return.home': {
				const mem = creep.memory;
				mem.targetRoom = creep.memory.homeRoom;
				const parentCr = CartographyRepo.getRoomByName(mem.targetRoom);
				mem.targetPos.x = parentCr.controller.pos.x;
				mem.targetPos.y = parentCr.controller.pos.y;
				mem.state = "moveto.room";
			}	break;
			case 'claim': {
				const controller = creep.room.controller;
				if (controller) {
					if (controller.owner) {
						creep.memory.state = 'return.home';
					} else {
						const code = creep.claimController(creep.room.controller);
						switch (code) {
							case OK:
								creep.say("claiming");
								break;
							case ERR_NOT_IN_RANGE:
								creep.moveTo(creep.room.controller);
								break;
							case ERR_INVALID_TARGET:
								creep.say("nope");
								creep.memory.state = 'return.home';
								break;
							case ERR_GCL_NOT_ENOUGH:
								creep.say("> gcl");
								creep.memory.state = 'return.home';
								break;
							default:
								console.log(`claim error ${code}`);
						}
					}
				} else {
					creep.memory.state = 'request.claim';
				}
			}	break;
			case 'moveto.room': {
				const mem = creep.memory;
				const rp = new RoomPosition(mem.targetPos.x, mem.targetPos.y, mem.targetRoom);
				if (creep.pos.roomName === rp.roomName) {
					if (Math.abs(creep.pos.getRangeTo(rp.x, rp.y)) < 2) {
						creep.memory.state = "claim";
					} else {
						creep.moveTo(rp);
					}
				} else {
					creep.moveTo(rp);
				}
			}	break;
			case 'manual': {

			}	break;
			default: {
				if (!creep.memory.homeRoom) {
					creep.memory.homeRoom = creep.room.name;
				}
				const parentCr = CartographyRepo.getRoom(creep.room);
				if (parentCr) {
					for (let roomName in parentCr.neighbours) {
						//Game.map.findExit(creep.room, roomName);
						const cr = CartographyRepo.getRoomByName(roomName);
						if (cr && !cr.owner && cr.controller) {
							creep.memory.targetRoom = cr.name;
							creep.memory.targetPos = _.clone(cr.controller.pos);
							creep.say(`clm ${cr.name}`);
							creep.memory.state = "moveto.room";
							break;
						}
					}

					if (creep.memory.state !== "moveto.room") {
						creep.say("no clm");
					}
				} else {
					creep.say("no par");
				}
			}
		}
	}
}

export default ClaimerRole;
