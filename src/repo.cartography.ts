import * as _ from "lodash";

/**
 * The Cartography Repo houses information on the world as discovered by
 * the creeps.
 *
 * It will store information minerals, energy sites, controllers and other
 * data for later viewing by the hive.
 */
namespace CartographyRepo {
	enum Status {
		UNKNOWN,
		NO,
		YES
	}

	enum Hostility {
		UNKNOWN,
		NO,
		YES
	}

	type ICartographyPosition = {
		x: number;
		y: number;
	}

	export interface ICartographySource {
		pos: ICartographyPosition;
	}

	export interface ICartographyMineral {
		pos: ICartographyPosition;
		type: string;
		amount: number;
	}

	export interface ICartographyNeighbour {
		surveyed: boolean;
		name: string;
		accessible: Status;
		direction: number;
	}

	export type ICartographyNeighbours = {
		[roomName: string]: ICartographyNeighbour;
	}

	export interface ICartographyController {
		pos: ICartographyPosition;
		level: number;
	}

	export interface ICartographyRoom {
		name: string;
		owner?: string;
		visitedAt?: number;
		hostility: Hostility;
		controller?: ICartographyController;
		sources: ICartographySource[];
		minerals: ICartographyMineral[];
		neighbours: ICartographyNeighbours;
	}

	export interface ICartographyQuest {
		id: number;
		attempts: number;
		parentRoom: string;
		targetRoom: string;
		// the name of the creep surveying
		surveyor: string;
		sleep: number;
	}

	export interface IMemorySchema {
		version: number,
		questCounter: number;
		quests: {[roomName: string]: ICartographyQuest[]};
		activeQuests: ICartographyQuest[];
		cancelledQuests: ICartographyQuest[];
		rooms: {[roomName: string]: ICartographyRoom};
	}

	export const DIRS = [1, 3, 5, 7];

	export function reset() {
		Memory['cartography'] = null;
		return this;
	}

	const MEMORY_VERSION = 1;

	function newCartographyMemory(): IMemorySchema {
		return <IMemorySchema>{
			version: MEMORY_VERSION,
			activeQuests: [],
			cancelledQuests: [],
			questCounter: 0,
			rooms: {},
			quests: {}
		};
	}

	export function memory(): IMemorySchema {
		if (!Memory['cartography']) {
			Memory['cartography'] = newCartographyMemory();
		}

		if (Memory['cartography']['version'] !== MEMORY_VERSION) {
			console.log("Updated memory format");
			Memory['cartography'] = _.merge(newCartographyMemory, Memory['cartography']);
		}
		return Memory['cartography'];
	}

	/**
     * Logs the selected memory into the cartography library
     *
     * @param {Object} mem the memory to log
	 */
	export function log(mem) {
		if (mem.survey) {
			/** @todo */
		}
	}

	/**
	 * Logs a creep's survey information into the cartography memory
	 *
	 * @param {Creep} creep the creep to log
	 */
	export function logCreep(creep: Creep) {
		if (creep) {
			log(creep.memory);
			if (creep.memory.survey) {
				// The mem can now forget all about his little voyage
				delete creep.memory.survey;
			}
		}
	}

	function newQuest(parentRoom: string, room: string): ICartographyQuest {
		const mem = memory();
		return {
			id: ++mem.questCounter,
			attempts: 0,
			parentRoom: parentRoom,
			targetRoom: room,
			surveyor: null,
			sleep: 0
		};
	}

	export function addQuest(q: ICartographyQuest) {
		const mem = memory();
		if (!mem.quests[q.parentRoom]) {
			mem.quests[q.parentRoom] = [];
		}
		mem.quests[q.parentRoom].push(q);
		console.log(`Created new Quest for ${q.parentRoom} to ${q.targetRoom}`);
		return q;
	}

	export function createQuestByRoomName(name: string, room: string): ICartographyQuest {
		const q = newQuest(name, room);

		return addQuest(q);
	}

	export function createQuest(currentRoom: Room, room: string): ICartographyQuest {
		return createQuestByRoomName(currentRoom.name, room);
	}

	function findFirstValidQuest(quests: ICartographyQuest[]) {
		return _.find(quests, (q) => {
			return q.sleep <= 0;
		});
	}

	export function requestLocalQuest(roomName: string): ICartographyQuest {
		const mem = memory();
		const quests = mem.quests[roomName];
		if (quests && quests.length > 0) {
			return findFirstValidQuest(quests)
		}
		return null;
	}

	export function requestAnyQuest(): ICartographyQuest {
		const mem = memory();
		for (let name in mem.quests) {
			const quests = mem.quests[name];
			if (quests && quests.length > 0) {
				const quest = findFirstValidQuest(quests);
				if (quest) {
					return quest;
				}
			}
		}
		return null;
	}

	export function requestQuest(roomName: string): ICartographyQuest {
		return requestLocalQuest(roomName) || requestAnyQuest();
	}
	/**
	 * Ask for a location to explore
	 */
	export function requestQuestForRoom(currentRoom: Room): ICartographyQuest {
		return requestQuest(currentRoom.name);
	}

	export function moveQuestToActive(quest: ICartographyQuest): ICartographyQuest {
		const mem = memory();
		_.remove(mem.quests[quest.parentRoom], (q) => {
			return q.id === quest.id;
		});
		mem.activeQuests.push(quest);
		console.log(`Quest ${quest.parentRoom} > ${quest.targetRoom} is now active`);
		return quest;
	}

	export function completeQuestById(questId: number) {
		const mem = memory();
		const [quest] = _.remove(mem.activeQuests, (q) => {
			return q.id === questId;
		});
		if (quest) {
			console.log(`Quest ${quest.parentRoom} > ${quest.targetRoom} has been completed`);
		}
		return this;
	}

	export function acceptQuest(quest: ICartographyQuest, creep: Creep): ICartographyQuest {
		console.log(`Quest ${quest.id} '${quest.parentRoom} > ${quest.targetRoom}' has been accepted by ${creep.name}`);
		quest.surveyor = creep.name;
		quest.attempts += 1;
		return moveQuestToActive(quest);
	}

	export function cancelQuestById(questId: number) {
		const mem = memory();
		const quests = _.remove(mem.activeQuests, {id: questId});
		quests.forEach((q) => {
			q.sleep = 120;
			q.surveyor = null;
			console.log(`Quest ${q.id} '${q.parentRoom} > ${q.targetRoom}' has been cancelled.`);
			mem.cancelledQuests.push(q);
		});
		return this;
	}

	function newNeighbour(): ICartographyNeighbour {
		return {
			direction: 0,
			surveyed: false,
			name: null,
			accessible: Status.UNKNOWN
		};
	}

	function getOwnerName(room: Room) {
		if (room.controller.owner) {
			return room.controller.owner.username;
		}
		return null;
	}

	export function newRoom(room: Room): ICartographyRoom {
		const cr = <ICartographyRoom>{
			name: room.name,
			owner: getOwnerName(room),
			visitedAt: -1,
			hostility: Hostility.UNKNOWN,
			controller: null,
			sources: [],
			minerals: [],
			neighbours: {}
		};

		const minerals = <Mineral[]>room.find(FIND_MINERALS);
		if (minerals && minerals.length > 0) {
			minerals.forEach((m: Mineral) => {
				cr.minerals.push({
					pos: {
						x: m.pos.x,
						y: m.pos.y
					},
					type: m.mineralType,
					amount: m.mineralAmount
				});
			});
		}

		const sources = <Source[]>room.find(FIND_SOURCES);
		if (sources && sources.length > 0) {
			sources.forEach((s: Source) => {
				cr.sources.push({
					pos: {
						x: s.pos.x,
						y: s.pos.y
					}
				});
			});
		}

		if (room.controller) {
			const ct = room.controller;
			cr.controller = {
				level: ct.level,
				pos: {
					x: ct.pos.x,
					y: ct.pos.y
				}
			}
		}

		return cr;
	}

	export function markInaccesible(n: ICartographyNeighbour) {
		n.accessible = Status.NO;
		n.surveyed = true;
		return n;
	}

	export function markExits(cr: ICartographyRoom) {
		const exs = Game.map.describeExits(cr.name);
		if (exs) {
			DIRS.forEach((dir: number) => {
				const roomName = exs[dir];
				const n: ICartographyNeighbour = newNeighbour();
				n.direction = dir;

				if (roomName) {
					n.name = roomName;
					n.accessible = Status.YES;
					createQuestByRoomName(cr.name, roomName);
					cr.neighbours[roomName] = n;
				} else {
					markInaccesible(n);
				}
			});
		}
		return cr;
	}

	export function hasRoomByName(name: string) {
		const mem = memory();
		return !!mem.rooms[name];
	}

	export function hasRoom(room: Room) {
		return hasRoomByName(room.name);
	}

	export function initRoom(room: Room): ICartographyRoom {
		console.log(`Initializing new Cartography Room ${room.name}`);
		const mem = memory();
		const cr = mem.rooms[room.name] = newRoom(room);
		return markExits(cr);
	}

	export function getRoomByName(room: string): ICartographyRoom {
		const mem = memory();
		return mem.rooms[room];
	}

	export function getRoom(room: Room): ICartographyRoom {
		const mem = memory();
		if (!mem.rooms[room.name]) {
			return initRoom(room);
		}
		return getRoomByName(room.name);
	}

	export function visitedRoom(room: Room): ICartographyRoom {
		const cr = getRoom(room);
		cr.visitedAt = Game.time;
		return cr;
	}

	export function run() {
		const mem = memory();
		const c = mem.cancelledQuests;
		if (c.length > 0) {
			const restoredQuests = _.remove(c, (q) => {
				q.sleep--;
				return q.sleep <= 0;
			});

			restoredQuests.forEach((q) => {
				addQuest(q);
			});
		}
	}
}

export default CartographyRepo;
