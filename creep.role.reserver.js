module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		if(this.task) {
			// Already busy
		} else if(!this.memory.reserveRoom) {
			let room = Empire.getReserveRoom();

			if(room) {
				this.memory.reserveRoom = room;
				Memory.rooms[room].reserverID = this.name;
			}
		} else if(this.room.name != this.memory.reserveRoom) {
			this.assignTask({name: "mini_move", x: 25, y: 25, roomName: this.memory.reserveRoom, min_dist: 22 });
		} else {
			this.assignTask({name: "reserve", target_id: this.room.controller.id});
		}
	},
};

