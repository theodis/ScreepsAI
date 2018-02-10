Empire = {};

require('empire.manager.recycler');

Empire.MAX_CLAIM_DISTANCE = 4;

Empire.run = function() {
	Empire.recycle();

	let spawn = Empire.mainSpawn;
	if(!spawn.spawning && spawn.room.energyAvailable === spawn.room.energyCapacityAvailable) {
		if(spawn.room.storage && spawn.room.storage.store.energy >= 20000) {
			let role = null;
			if(Empire.scoutCount < 1)
				role = "scout";
			else if(Empire.cleanupCount < 1 && Empire.cleanupRooms.length)
				role = "cleanup";
			else if(Empire.getReserveRoom())
				role = "reserver";
			else if(Empire.getReserveWorkRoom())
				role = "reserveworker";
			if(role) {
				const name = role + Game.time;
				const loadout = Creep.getRoleLoadout(role, spawn.room.energyAvailable);
				const buyCost = creepCost(loadout);
				spawn.spawnCreep(loadout,name,{memory: {role, buyCost} });
			}
		}
	}

	if(spawn.room.storage && spawn.room.storage.store.energy >= 30000) {
		if(!Empire.developingRoom && Empire.potentialReserves.length) {
			// Pick a room and start reserve process
			let room = Empire.potentialReserves[0];
			Empire.developingRoom = room;
			Empire.reservedRooms.push(room);
			Memory.rooms[room].developing = true;
		}
	}
}

Empire.creepCount = function(role) {
	let count = 0;
	for(let name in Game.creeps)
		if(Game.creeps[name].role === role)
			count ++;
	return count;
}


Object.defineProperty(Empire, 'scoutCount', {
	get: function() {
		return Empire.creepCount("scout");
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'cleanupCount', {
	get: function() {
		return Empire.creepCount("cleanup");
	},
	enumerable: false,
	configurable: true
});

Empire.nearestSpawn = function(to) {
	if(!to) return null;
	if(typeof to !== "string") return Empire.nearestSpawn(to.roomName || to.pos.roomName);

	let nearestSpawn = () => {
		let spawns = Object.keys(Game.rooms)
					.map(key => Game.rooms[key])
					.filter(room => room.mainSpawn)
					.map(room => room.mainSpawn);
		let min = -1;
		let best = null;
		spawns.forEach(spawn => {
			let dist = distance(spawn, to);
			if(!best || dist < min) {
				best = spawn;
				min = dist;
			}
		});

		return best;
	}

	return nearestSpawn();
	//return Game.getObjectById(Memoize.get("nearestSpawn:" + to, nearestSpawn, undefined, 1000).id);
}

Empire.nearestSpawnDistance = function(to) {
	if(!to) return null;
	if(typeof to !== "string") return Empire.nearestSpawnDistance(to.roomName || to.pos.roomName);

	return Memoize.get("nearestSpawn:" + to, () => Game.map.findRoute(Empire.nearestSpawn(to).room, to).length, undefined, 1000);
}

Object.defineProperty(Empire, 'mainSpawn', {
	get: function() {
		let mainSpawn = () => Object.keys(Game.rooms)
					.map(key => Game.rooms[key])
					.reduce((accumulator, currentValue) => accumulator === null ? currentValue : (currentValue === null ? accumulator : (currentValue.energyCapacityAvailable > accumulator.energyCapacityAvailable ? currentValue : accumulator)))
					.mainSpawn;
		return Game.getObjectById(Memoize.get("mainSpawn", mainSpawn, undefined, 100).id);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'memory', {
	get: function() {
		if(!Memory.empire) Memory.empire = {};
		return Memory.empire;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'lastVisited', {
	get: function() {
		if(!Empire.memory.lastVisited) Empire.memory.lastVisited = {}
		return Empire.memory.lastVisited;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'unvisited', {
	get: function() {
		if(!Empire.memory.unvisited) Empire.memory.unvisited = {}
		return Empire.memory.unvisited;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'potentialReserves', {
	get: function() {
		const lastVisited = this.lastVisited;
		let potential = [];

		for(let name in lastVisited)
			if(Memory.rooms[name].type === "neutral" && Memory.rooms[name].sourceCount)
				potential.push(name);

		let min = 0;
		let ret = null;

		potential.forEach(name => {
			let dist = Empire.nearestSpawnDistance(name) + 2 - Memory.rooms[name].sourceCount;
			if(!ret || dist < min) {
				min = dist;
				ret = [name];
			} else if(dist === min) {
				ret.push(name);
			}
		});

		return ret;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'cleanupRooms', {
	get: function() {
		const lastVisited = this.lastVisited;
		let ret = [];

		for(let name in lastVisited) {
			let m = Memory.rooms[name];
			if(m.enemyTowerCount === 0 && m.enemyAttackParts === 0 && m.enemyStructureCount > 0 && !m.safeMode && m.sourceCount < 3)
				ret.push(name);
		}

		return ret;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'reservedRooms', {
	get: function() {
		if(!Empire.memory.reservedRooms) Empire.memory.reservedRooms = [];
		return Empire.memory.reservedRooms;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Empire, 'developingRoom', {
	get: function() { return Empire.memory.developingRoom; },
	set: function(value) { Empire.memory.developingRoom = value;},
	enumerable: false,
	configurable: true
});

Empire.getReserveRoom = function() {
	let reserved = this.reservedRooms.filter(room => {
		let m = Memory.rooms[room];
		return !m.reserverID && (!m.reservationTime || m.reservationTime < 3000);
	});
	let best = null;
	let min = 0;

	reserved.forEach(room => {
		let m = Memory.rooms[room];
		let count = m.reservationTime || 0;
		if(!best || count < min) {
			best = room;
			min = count;
		}
	})

	return best;
}

Empire.getReserveWorkRoom = function() {
	let reserved = this.reservedRooms.filter(room => !Memory.rooms[room].reserveWorkerID)
	if(!reserved.length) return null;
	return reserved[0];
}
