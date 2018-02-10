module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		if(this.task) {
			// Continue work
		} else {
			let targets = this.room.findTypes([FIND_HOSTILE_CREEPS, FIND_HOSTILE_STRUCTURES]);
			if(targets.length) {
				// Attack something
				let target = getNearest(this, targets);
				this.assignTask({name: "attack", target_id: target.id});
			} else {
				// Move on
				let rooms = Empire.cleanupRooms;
				if(rooms.length) {
					let best = null;
					let min = 0;
					rooms.forEach(room => {
						let dist = Game.map.findRoute(this.room, room);
						if(!best || dist < min) {
							best = room;
							min = dist;
						}
					})

					if(best)
						this.assignTask({name: "mini_move", x: 25, y: 25, roomName: best, min_dist: 49 });
				} else {
					// Nothing left to cleanupRooms
					this.suicide();
				}
			}

		}
	},
};

