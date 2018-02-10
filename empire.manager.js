Empire = {};

require('empire.manager.recycler');

Empire.MAX_CLAIM_DISTANCE = 4;

Empire.run = function() {
	Empire.recycle();

	let spawn = Empire.mainSpawn;
	if(spawn.room.energyAvailable === spawn.room.energyCapacityAvailable) {
		if(spawn.room.storage && Empire.scoutCount < 1) {
			const role = "scout"
			const name = role + Game.time;
			const loadout = Creep.getRoleLoadout(role, spawn.room.energyAvailable);
			const buyCost = creepCost(loadout);
			spawn.spawnCreep(loadout,name,{memory: {role, buyCost} });
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

	return Memoize.get("nearestSpawn:" + to, nearestSpawn, undefined, 1000);
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
		return Memoize.get("mainSpawn", mainSpawn, undefined, 100);
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

Object.defineProperty(Empire, 'developingRoomCount', {
	get: function() {
		const lastVisited = this.lastVisited;
		let count = 0;

		for(let name in lastVisited)
			if(Memory.rooms[name].developing)
				count++;

		return count;
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
			if(m.enemyTowerCount === 0 && m.enemyAttackParts === 0 && m.enemyStructureCount > 0 && !m.safeMode)
				ret.push(name);
		}

		return ret;
	},
	enumerable: false,
	configurable: true
});
