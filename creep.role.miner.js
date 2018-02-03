module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		//Miner claims a spot
		//Mines until full
		//Returns energy to source container
		//If no source container drop it off at the storage
		//If no storage, drop it off at the spawn

		if(this.task) {
			//Carry on
		} else if(this.carry.energy === 0) {
			if(!this.memory.claim) this.memory.claim = this.room.claimSourceMineSpot(this.carryCapacity, this);
			let mineSpot = this.memory.claim;
			if(mineSpot === null) return false;
		}
	},
};
