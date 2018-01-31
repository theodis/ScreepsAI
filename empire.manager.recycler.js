Empire.recycle = function() {
	Empire.recycleCreepMemory();
}

Empire.recycleCreepMemory = function() {
	for(let name in Memory.creeps) {
		if(!(name in Game.creeps)) {
			//Creep no longer around
			//If it had a claim revoke it
			let claim = Memory.creeps[name].claim;
			if(claim && claim.room) Game.rooms[claim.room].unclaimSourceMineSpot(claim);
			delete Memory.creeps[name];
		}
	}
}
