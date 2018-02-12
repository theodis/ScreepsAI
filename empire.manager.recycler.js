Empire.recycle = function() {
	Empire.recycleCreepMemory();
}

Empire.recycleCreepMemory = function() {
	for(let name in Memory.creeps) {
		if(!(name in Game.creeps)) {
			const cm = Memory.creeps[name];
			const rm = Memory.rooms[cm.lastRoom];

			//Creep no longer around
			//If it had a claim revoke it
			let claim = cm.claim;
			if(claim && claim.room) Game.rooms[claim.room].unclaimSourceMineSpot(claim);

			//Clear creep reservation claim
			let reserveRoom = cm.reserveRoom;
			let role = cm.role;
			if(reserveRoom && role === "reserver") delete Memory.rooms[reserveRoom].reserverID;
			if(reserveRoom && role === "reserveworker") delete Memory.rooms[reserveRoom].reserveWorkerID;

			if(!rm.avoid) rm.avoid = 0;
			rm.avoid += 100;

			console.log(name,"died in", cm.lastRoom);
			delete Memory.creeps[name];
		}
	}
}
