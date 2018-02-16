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
		} else if(this.hits < this.hitsMax / 2) {
			// Return to heal
			this.assignTask({name: "renew"});
		} else {
			// Find a room to scout
			// Possible rooms are rooms that haven't been visited in 10000
			// ticks or never visited

			let rooms = [];
			let time = Game.time;
			let lastVisited = Empire.lastVisited;
			for(let room in lastVisited)
				if(lastVisited[room] + 10000 <= time)
					rooms.push(room);
			rooms.push(...Object.keys(Empire.unvisited));
			if(rooms.length) {
				let min = 0;
				let best = null;
				rooms.forEach(room => {
					let spawnDist = Empire.nearestSpawnDistance(room);
					let scoutPath = Game.map.findRoute(this.room, room, {routeCallback: avoidEnemyRoomsCallback});
					let scoutDist = scoutPath.length;
					let score = spawnDist + scoutDist;
					if(scoutDist && (!best || score < min)) {
						min = score;
						best = room;
					}
				});
				this.assignTask({name: "mini_move", x: 25, y: 25, roomName: best, min_dist: 22 });
			}
		}
	},
};

