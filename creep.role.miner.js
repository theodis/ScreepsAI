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
			//Grab a claim if don't already have one
			this.assignTask({name: "mine"});
		} else {
			//Drop off energy
			let target = null;
			//console.log(claim, this.room.getClaimContainer(claim));
			if(this.memory.claimContainerID) target = Game.getObjectById(this.memory.claimContainerID);
			if(!target && this.room.storage) target = this.room.storage;
			if(!target) target = this.room.mainSpawn;
			this.assignTask({name: "mini_move", action: "transfer", target_id: target.id, action_params: [RESOURCE_ENERGY]});
		}
	},
};
