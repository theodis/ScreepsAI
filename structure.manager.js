Object.defineProperty(Structure.prototype, 'hitsRepair', {
	get: function() {
		if(this.structureType === STRUCTURE_WALL || this.structureType === STRUCTURE_RAMPART)
			return 10000;
		return this.hitsMax / 2;
	},
	enumerable: false,
	configurable: true
});
