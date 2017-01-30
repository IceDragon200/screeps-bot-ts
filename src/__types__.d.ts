/// <reference path="../typings/globals/screeps/index.d.ts" />

import {Action} from "./action_queue";

export interface IHasMemory {
	memory: any;
}

export interface Waypoints {
	color1: number;
	color2: number;
	counter: number;
	prev: number;
}

export interface WaypointsMap {
	[name: string]: Waypoints;
}

export interface ILoggable {
	log(text: string): ExtendedSpawn;
}

export interface IActionSystem {
	nextAction(name: string, ...params: any[]): Action;
}

export interface IUnitSystem {
	clearUnitQueue(): ExtendedSpawn;
	unqueueUnit(role: string, count: number): ExtendedSpawn;
	enqueueUnit(role: string, count: number): ExtendedSpawn;
}

export interface ExtendedFlag extends Flag, ILoggable, IActionSystem, IUnitSystem {}
export interface ExtendedSpawn extends Spawn, ILoggable, IActionSystem, IUnitSystem {}
export interface ExtendedCreep extends Creep, ILoggable, IActionSystem {}

export interface IWaypointsSystem {
	getWaypointsMap(): WaypointsMap;
	getWaypoints(name: string, c1?: number, c2?: number): Waypoints;
	getWaypoint(name: string, index: number): Flag;
	getNextWaypointFromFlag(flag: Flag): Flag;
	getNextWaypoint(name: string, index: number): Flag;
	loopWaypoint(name: string): Room;
	addWaypoint(name: string, x: number, y: number, c1?: number, c2?: number): Room;
	destroyWaypoint(name: string, index: number): Room;
	destroyWaypoints(name: string): Room;
	destroyAllWaypoints(): Room;
}

export interface FindStructureAndWeightOptions {
	filter: (st: Structure) => boolean;
	sortBy: (st: Structure) => any;
}

export interface ExtendedRoom extends Room, IWaypointsSystem {
	findStructuresAndWeigh(weights: {[structureType: number]: number}, options: FindStructureAndWeightOptions): Structure[];
}

export interface ExtendedRoomPosition extends RoomPosition {
	offset(x: number, y: number): RoomPosition;
	north(amt?: number): RoomPosition;
	south(amt?: number): RoomPosition;
	west(amt?: number): RoomPosition;
	east(amt?: number): RoomPosition;
}
