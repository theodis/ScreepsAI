Room.prototype.reset = function() {this.clear(); this.resetMemory();}
Room.prototype.resetMemory = function() {Object.keys(this.memory).forEach(key => delete this.memory[key]); };

Room.prototype.clear = function() {
	this.find(FIND_FLAGS).forEach(flag => flag.remove());
	this.find(FIND_CONSTRUCTION_SITES).forEach(site => site.remove());
	this.find(FIND_CREEPS).forEach(creep => {creep.suicide()});
	this.find(FIND_STRUCTURES, {filter: struct => struct.name !== "MainSpawn:W3N8"}).forEach(struct => struct.destroy());
};

Room.prototype.resetClaims = function() {
	let spots = this.sourceMineSpots;
	let claims = this.sourceClaims;

	for(let key in Memory.creeps) {
		let creepMemory = Memory.creeps[key];
		if(creepMemory.claim && creepMemory.claim.room == this.name)
			delete creepMemory.claim;
	}

	for(let key in claims) {
		claims[key] = [];
		for(let i = 0; i < spots[key].length; i++)
			claims[key][i] = i;
	}
};
