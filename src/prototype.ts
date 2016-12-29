import CreepQueue from "./creep_queue";

Object.defineProperty(StructureTower, 'memory', {
	get: function() { return Memory['towers'][this.id]; },
	set: function(v) { return Memory['towers'][this.id] = v;}
});

StructureSpawn.prototype.enqueue = function(role: string) {
	this.memory.queue = CreepQueue.append(this.memory.queue, role);
	return this;
}

RoomPosition.prototype.offset = function(x, y) {
	return new RoomPosition(this.x + x, this.y + y, this.roomName);
}

RoomPosition.prototype.north = function(amt = 1) {
	return this.offset(0, -amt);
}

RoomPosition.prototype.south = function(amt = 1) {
	return this.offset(0, amt);
}

RoomPosition.prototype.west = function(amt = 1) {
	return this.offset(-amt, 0);
}

RoomPosition.prototype.east = function(amt = 1) {
	return this.offset(amt, 0);
}
