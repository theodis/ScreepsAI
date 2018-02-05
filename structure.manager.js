Object.defineProperty(Structure.prototype, 'hitsRepair', {
	get: function() {
		if(this.structureType === STRUCTURE_WALL || this.structureType === STRUCTURE_RAMPART)
			return 10000;
		return this.hitsMax / 2;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Structure.prototype, 'hitsFortify', {
	get: function() {
		if(this.structureType === STRUCTURE_RAMPART || this.structureType === STRUCTURE_WALL)
			return Math.min(CONTROLLER_LEVELS[Math.max(1,this.room.controller.level - 1)], this.hitsMax);
		return 0;
	},
	enumerable: false,
	configurable: true
});
