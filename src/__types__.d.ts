/// <reference path="../typings/globals/screeps/index.d.ts" />

import {Action} from "./action_queue";

export interface Waypoints {
	color1: number;
	color2: number;
	counter: number;
	prev: number;
}

export interface WaypointsMap {
	[name: string]: Waypoints;
}

export interface ExtendedSpawn extends Spawn {
	log(text: string): ExtendedSpawn;
	nextAction(name: string, ...params: any[]): Action;
	unqueueUnit(role: string, count: number): ExtendedSpawn;
	enqueueUnit(role: string, count: number): ExtendedSpawn;
}

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

export interface ExtendedRoom extends Room, IWaypointsSystem {
}

export interface ExtendedRoomPosition extends RoomPosition {
	offset(x: number, y: number): RoomPosition;
	north(amt?: number): RoomPosition;
	south(amt?: number): RoomPosition;
	west(amt?: number): RoomPosition;
	east(amt?: number): RoomPosition;
}
