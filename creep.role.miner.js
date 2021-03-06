module.exports = {
	start: function() {
		if(!this.memory.workRoom) this.memory.workRoom = this.room.name;
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
		} else if(this.room.name != this.memory.workRoom) {
			// Get to the right room
			this.assignTask({name: "mini_move", x: 25, y: 25, roomName: this.memory.workRoom, min_dist: 22 });
		} else if(this.carry.energy === 0) {
			//Grab a claim if don't already have one
			this.assignTask({name: "mine"});
		} else {
			//Drop off energy
			this.assignTask({name: "unload_energy", dest: "container|storage"});
		}
	},
};
