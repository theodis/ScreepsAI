module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		if(this.task) {
			//Already busy
		} else if(!this.memory.workRoom) {
			let room = Empire.getReserveWorkRoom();
			console.log(room);
			this.memory.workRoom = room;
			Memory.rooms[room].reserveWorkerID = this.name;
		} else if(this.room.name != this.memory.workRoom) {
			// Get to the right room
			this.assignTask({name: "mini_move", x: 25, y: 25, roomName: this.memory.workRoom, min_dist: 22 });
		} else if(this.carry.energy === 0) {
			this.assignTask({name: "mine"});
		} else if(this.room.repairTargets.length) {
			this.assignTask({name: "repair", target_id: getNearest(this, this.room.repairTargets).id });
		} else if(this.room.buildTargets.length > 0) {
			this.assignTask({name: "build", target_id: this.room.nearestBuildTarget(this.pos.x, this.pos.y).id });
		} else {
			this.assignTask({name: "unload_energy", dest: "container"});
		}

	},
};
