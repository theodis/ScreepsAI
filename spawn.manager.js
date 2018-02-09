Object.defineProperty(StructureSpawn.prototype, 'adjacentCreeps', {
	get: function() {
		let adjacentCreeps = () => this.room.lookForAtArea(LOOK_CREEPS, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true)
			.map(res => res.creep);
		return Memoize.get("adjacentCreeps", adjacentCreeps, this);
	},
	enumerable: false,
	configurable: true
});
