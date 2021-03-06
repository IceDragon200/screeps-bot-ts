import {ExtendedSpawn, IWaypointsSystem, WaypointsMap, Waypoints, ExtendedRoom, FindStructureAndWeightOptions} from "./__types__";
import * as _ from "lodash";
import Objects from "./objects";
import ActionQueue, {Action} from "./action_queue";

/*Object.defineProperty(StructureTower, 'memory', {
	get: function() { return Memory['towers'][this.id]; },
	set: function(v) { Memory['towers'][this.id] = v;}
});*/

const Loggable = {
	log(text: string): ExtendedSpawn {
		console.log(`[${this.name}] ${text}`);
		return this;
	}
};

const ActionSystem = {
	nextAction(name: string, ...params: any[]): Action {
		Objects.patch(this.memory, 'actionCounter', () => {
			return 0;
		});

		return {
			id: this.memory['actionCounter']++,
			name: name,
			params: params
		};
	},

	createAction(name: string, ...params: any[]): Action {
		const action: Action = this.nextAction(name, ...params);
		this.memory.actions = ActionQueue.append(this.memory.actions, action);
		return action;
	}
};

const UnitSystem = {
	clearUnitQueue(): ExtendedSpawn {
		if (this.memory.unitQueue) {
			this.memory.unitQueue = [];
		}
		return this;
	},

	unqueueUnit(role: string, count: number = -1): ExtendedSpawn {
		if (this.memory.unitQueue) {
			let removed = 0;
			if (count < 0) {
				const un = _.remove(this.memory.unitQueue, (a: Action) => {
					return a.params[0] === role;
				});
				removed += un.length;
			} else {
				for (let i = 0; i < count; ++i) {
					const index = _.indexOf(this.memory.unitQueue, (a: Action) => {
						return a.params[0] === role;
					});
					if (index >= 0) {
						this.memory.unitQueue.splice(index, 1);
						removed++;
					}
				}
			}
			if (removed > 0) {
				console.log(`Unqueued ${removed} ${role}`);
			}
		}
		return this;
	},

	/**
	 * Queues a creep to be spawned, or multiple creeps.
	 *
	 * @param {string} role
	 * @param {number} count
	 * @param {object} options
	 * @options options
	 * @option options {number} level
	 * @option options {object} memory
	 */
	enqueueUnit(role: string, count: number = 1, options = {}): ExtendedSpawn {
		for (let i = 0; i < count; ++i) {
			const action = this.nextAction('spawn', role, options);
			this.memory.unitQueue = ActionQueue.append(this.memory.unitQueue, action);
		}
		console.log(`${this.name} queued ${count} ${role}`);
		return this;
	}
};

_.extend(Creep.prototype, Loggable, ActionSystem);
_.extend(StructureSpawn.prototype, Loggable, ActionSystem, UnitSystem);
_.extend(Flag.prototype, Loggable, ActionSystem, UnitSystem);

_.extend(RoomPosition.prototype, {
	offset(x: number, y: number): RoomPosition {
		return new RoomPosition(this.x + x, this.y + y, this.roomName);
	},

	north(amt = 1): RoomPosition {
		return this.offset(0, -amt);
	},

	south(amt = 1): RoomPosition {
		return this.offset(0, amt);
	},

	west(amt = 1): RoomPosition {
		return this.offset(-amt, 0);
	},

	east(amt = 1): RoomPosition {
		return this.offset(amt, 0);
	}
});

function makeWaypointName(name: string, index: number): string {
	return `${name}.${index}`;
}

const WaypointsSystem: IWaypointsSystem = {
	getWaypointsMap(): WaypointsMap {
		return Objects.patch(this.memory, 'waypointsMap', () => {
			return <WaypointsMap>{};
		});
	},

	getWaypoints(name, c1?: number, c2?: number): Waypoints {
		const waypointsMap: WaypointsMap = this.getWaypointsMap();
		return Objects.patch(waypointsMap, name, () => {
			return <Waypoints>{
				color1: c1 || _.sample(COLORS_ALL),
				color2: c2 || _.sample(COLORS_ALL),
				counter: 0,
				prev: 0
			};
		});
	},

	getWaypoint(name: string, index: number): Flag {
		return Game.flags[makeWaypointName(name, index)];
	},

	getNextWaypointFromFlag(flag: Flag): Flag {
		if (flag && flag.memory.waypoint) {
			if (flag.memory.waypoint.next) {
				return this.getWaypoint(flag.memory.waypoint.next.name, flag.memory.waypoint.next.index);
			}
		}
		return null;
	},

	getNextWaypoint(name: string, index: number): Flag {
		const flag: Flag = this.getWaypoint(name, index);
		return this.getNextWaypointFromFlag(flag);
	},

	loopWaypoint(name: string): Room {
		const waypoints: Waypoints = this.getWaypoints(name);
		if (waypoints.counter > 0) {
			const head: Flag = this.getWaypoint(name, 1);
			const tail: Flag = this.getWaypoint(name, waypoints.counter);
			tail.memory.waypoint.next = {
				name: head.memory.waypoint.name,
				index: head.memory.waypoint.index
			};
		}
		return this;
	},

	addWaypoint(name: string, x: number, y: number, c1?: number, c2?: number): Room {
		const waypoints: Waypoints = this.getWaypoints(name, c1, c2);

		waypoints.prev = waypoints.counter;
		const waypointName = makeWaypointName(name, ++waypoints.counter);
		this.createFlag(x, y, waypointName, waypoints.color1, waypoints.color2);

		console.log(`Added waypoint ${waypointName} @ {${x}, ${y}}`);

		const curFlag: Flag = this.getWaypoint(name, waypoints.counter);
		curFlag.memory.waypoint = {
			name: name,
			index: waypoints.counter,
			next: null
		};

		const prevFlag: Flag = this.getWaypoint(name, waypoints.prev);
		if (prevFlag) {
			prevFlag.memory.waypoint.next = {
				name: name,
				index: waypoints.counter
			};
		}
		return this;
	},

	destroyWaypoint(name: string, index: number): Room {
		const waypointName = makeWaypointName(name, index);
		const flag: Flag = this.getWaypoint(name, index);
		if (flag) {
			flag.remove();
		}
		delete Memory.flags[waypointName];
		console.log(`Removed Waypoint ${waypointName}`);
		return this;
	},

	destroyWaypoints(name: string): Room {
		const waypointsMap: WaypointsMap = this.getWaypointsMap();
		if (waypointsMap[name]) {
			const waypoints: Waypoints = this.getWaypoints(name);
			for (let i = 1; i <= waypoints.counter; ++i) {
				this.destroyWaypoint(name, i);
			}
			delete waypointsMap[name];
		}
		return this;
	},

	destroyAllWaypoints(): Room {
		const waypointsMap: WaypointsMap = this.getWaypointsMap();
		for (let name in waypointsMap) {
			this.destroyWaypoints(name);
		}
		return this;
	}
};

const ExtendedFind = {
	findStructuresAndWeigh(weights: {[structureType: number]: number}, options: FindStructureAndWeightOptions): Structure[] {
		const room = <ExtendedRoom>this;
		const structures = <Structure[]>room.find(FIND_STRUCTURES, {
			filter: function(st: Structure) {
				return !!weights[st.structureType] && options.filter(st);
			}
		});

		return _.sortBy(structures, function(st) {
			return [weights[st.structureType], options.sortBy(st)];
		});
	}
};

_.extend(Room.prototype, ExtendedFind, WaypointsSystem);
