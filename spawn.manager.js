Object.defineProperty(StructureSpawn.prototype, 'adjacentCreeps', {
	get: function() {
		return this.room.lookForAtArea(LOOK_CREEPS, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true)
			.map(res => res.creep);
	},
	enumerable: false,
	configurable: true
});
