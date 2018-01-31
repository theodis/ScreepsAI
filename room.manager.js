require('room.manager.build');
require('room.manager.debug');

Room.WIDTH = 50;
Room.HEIGHT = 50;

Room.prototype.run = function() {
	const init = function() {
		console.log("Initializing room", this.name);
		//Initialize build queue
		this.memory.buildQueue = [];

		//Initialize room level
		this.memory.roomLevel = 1;

		//Plan out containers and initial roads

		//Flag storage
		let spawn = this.mainSpawn;
		let storageSpot = this.storageSpot; storageSpot = new RoomPosition(storageSpot.x, storageSpot.y, this.name);
		let spots = this.sourceContainerSpots;
		let mineSpots = this.sourceMineSpots;

		//Road from storage to spawn
		this.buildRoad(storageSpot, spawn.pos);

		//Place containers
		//Road from storage to containers
		//Road from containers to source mine spots
		Object.keys(spots).forEach(key => {
			let pos = spots[key];
			let roomPos = new RoomPosition(pos.x,pos.y,this.name);
			this.createConstructionSite(roomPos, "container");
			this.buildRoad(roomPos, storageSpot);

			//Road from container to mining spots
			mineSpots[key].forEach(mineSpot => {
				let mineSpotPos = new RoomPosition(mineSpot.x,mineSpot.y,this.name);
				this.buildRoad(roomPos, mineSpotPos);
			});
		});

		//Road from storage to controller
		this.buildRoad(storageSpot, this.controller.pos);

		//Roads around storage
		this.buildRoadAround(storageSpot.x, storageSpot.y);

		//Roads around containers
		Object.keys(spots).forEach(key => {
			let pos = spots[key];
			this.buildRoadAround(pos.x, pos.y);
		});

		//Roads around spawnCreep
		this.buildRoadAround(spawn.pos.x, spawn.pos.y);

		//Roads around controller
		this.buildRoadAround(this.controller.pos.x, this.controller.pos.y);

		this.memory.initialized = true;

	}.bind(this);

	const levelUp = function(level) {
		console.log("Room leveled up",this.name, level);
	}.bind(this);

	const maintenance = function() {
		let constructionCount = this.find(FIND_CONSTRUCTION_SITES).length;
		//if(constructionCount < Room.MAX_CONSTRUCTION_SITES) this.buildQueuedRoads(Room.MAX_CONSTRUCTION_SITES - constructionCount);
	}.bind(this);

	const planning = function() {
	}.bind(this);

	const loop = function() {
		const defaultWorkerLoadout = [WORK, WORK, CARRY, MOVE]
		if(Object.keys(Game.creeps).length < 8) {
			let name = "Bob" + Game.time;
			this.mainSpawn.spawnCreep(defaultWorkerLoadout,name,{memory: {role: "worker"}});
		}

		//Build workers until containers are built
		//Then build miners and cargo
	}.bind(this);

	if(!this.memory.initialized){
		if(global.lotsOfTime) init();
		else return; //Bail out if not enough time to initialize
	}
	while(this.memory.roomLevel < this.controller.level && global.lotsOfTime) levelUp(++this.memory.roomLevel);
	if(global.lotsOfTime) maintenance();
	if(global.lotsOfTime) planning();
	loop();

}

Room.prototype.peekClaimSourceMineSpot = function(minEnergy = 1, creep) {
	let max = -999999;
	let maxId = null;
	let maxInd = null;
	let spots = this.sourceMineSpots;
	let claims = this.sourceClaims;

	Object.keys(claims).forEach(id => {
		let spot = spots[id];
		let source = Game.getObjectById(id);
		let claimedRatio = claims[id].length / spots[id].length

		let basescore = source.energy;
		basescore *= claimedRatio;

		for(let ind of claims[id]) {
			let score = basescore;
			let creeps = this.lookForAt(LOOK_CREEPS, spot[ind].x, spot[ind].y);
			if(creeps.length && creeps[0] !== creep) continue;
			if(creep) score -= (Math.abs(spot[ind].x - creep.pos.x) + Math.abs(spot[ind].y - creep.pos.y))* 100;
			if(source.energy >= minEnergy && score > max && claims[id].length) {
				max = score;
				maxId = id;
				maxInd = ind;
			}
		}
	});

	if(maxId) {
		let pos = spots[maxId][maxInd];
		return { id: maxId, ind: maxInd, x: pos.x, y: pos.y, room: this.name }
	} else {
		return null;
	}
}

Room.prototype.claimSourceMineSpot = function(minEnergy = 1, creep) {
	let entry = this.peekClaimSourceMineSpot(minEnergy, creep);
	if(entry) {
		let claims = this.sourceClaims;
		let removeInd = claims[entry.id].indexOf(entry.ind);
		claims[entry.id].splice(removeInd, 1);
		this.memory.sourceClaims = claims;
	}
	return entry;
}

Room.prototype.unclaimSourceMineSpot = function(ret) {
	if(ret.room !== this.name) {
		Game.rooms[ret.room].unclaimSourceMineSpot(ret);
		return;
	}
	let spots = this.sourceMineSpots;
	let claims = this.sourceClaims;
	let spot = spots[ret.id];
	let claim = claims[ret.id];
	if(ret.ind < spot.length && claim.indexOf(ret.ind) === -1) {
		claim.push(ret.ind);
		this.memory.sourceClaims = claims;
	}
}

Room.prototype.findTypes = function(types, opts) {
	let ret = [];
	types.forEach(type => ret.push(...this.find(type,opts)));
	return ret;
}

Object.defineProperty(Room.prototype, 'storageSpot', {
	get: function() {
		if(!this.mine) return null;
		if(!this.memory.storageSpot) {
			//Check if storage flag already planted
			let flag = this.find(FIND_FLAGS, {filter: flag => flag.name === "Storage"});
			if(flag.length) {
				this.memory.storageSpot = flag[0].pos.x + "," + flag[0].pos.y
			} else {
				let stuff = this.findTypes([FIND_MY_SPAWNS, FIND_SOURCES])
				stuff.push(this.controller);
				let x = 0;
				let y = 0;
				stuff.forEach(item => {x += item.pos.x; y += item.pos.y;})
				x = Math.round(x / stuff.length);
				y = Math.round(y / stuff.length);
				pos = this.getFreeSpotNear(x,y,1,1,1);
				this.createFlag(pos.x,pos.y,"Storage",COLOR_YELLOW);
				this.memory.storageSpot = pos;
			}
		}
		return this.memory.storageSpot;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'sourceContainerSpots', {
	get: function() {
		if(!this.mine) return null;
		if(!this.memory.sourceContainerSpots) {
			let storageSpot = this.storageSpot;
			let spots = {};
			let sources = this.find(FIND_SOURCES);
			sources.forEach(source => {
				let flag = this.find(FIND_FLAGS, {filter: flag => flag === "SourceContainer:" + source.id});
				if(flag.length) {
					spots[source.id] = flag[0].pos.x + "," + flag[0].pos.y;
				} else {
					let path = source.pos.findPathTo(new RoomPosition(storageSpot.x,storageSpot.y,this.name));
					if(path.length >= 2);
					let pos = this.getFreeSpotNear(path[1].x,path[1].y,1,1,1);
					this.createFlag(pos.x,pos.y,"SourceContainer:" + source.id,COLOR_YELLOW);
					spots[source.id] = pos;
				}
			});
			this.memory.sourceContainerSpots = spots;
		}
		return this.memory.sourceContainerSpots;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'sourceMineSpots', {
	get: function() {
		if(!this.memory.sourceMineSpots || !this.memory.sourceClaims) {
			let sources = this.find(FIND_SOURCES);
			let spots = {};
			let claims = {};
			sources.forEach(source => {
				let tiles = this.lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
				spots[source.id] = []
				claims[source.id] = []
				tiles.forEach(tile => {
					if(tile.type == "terrain" && (tile.terrain == "swamp" || tile.terrain == "plain")) {
						claims[source.id].push(spots[source.id].length);
						spots[source.id].push({x:tile.x, y:tile.y});
					}
				});
			});
			this.memory.sourceMineSpots = spots;
			this.memory.sourceClaims = claims;
		}
		return this.memory.sourceMineSpots;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'sourceClaims', {
	get: function() {
		if(!this.memory.sourceMineSpots || !this.memory.sourceClaims) {
			this.sourceMineSpots;
		}
		return this.memory.sourceClaims;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'mainSpawn', {
	get: function() { return this.find(FIND_MY_SPAWNS, {filter: spawn => spawn.name === `MainSpawn:${this.name}`})[0] },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'mine', {
	get: function() { return this.controller.owner.username === global.username },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'repairTargetCount', {
	get: function() {
		if(this.memory.repairTargets) return this.memory.repairTargets.length;
		return 0;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'repairTargets', {
	get: function() {
		if(!this.memory.repairTargets || Game.time > this.memory.repairTargetsTime + 100) {
			let targets = [];
			this.find(FIND_MY_STRUCTURES, {filter: struct => struct.hits < struct.hitsMax / 2 }).forEach(struct => {
				targets.push({id: struct.id, x: struct.pos.x, y: struct.pos.y});
			});
			this.memory.repairTargets = targets;
			this.memory.repairTargetsTime = Game.time;
		}
		return 0;
	},
	enumerable: false,
	configurable: true
});

Room.prototype.getRepairTarget = function() {
	if(this.repairTargetCount === 0) return null;
	let repairTargets = this.repairTargets;
	let ret = Game.getObjectById(repairTarget.pop().id);
	this.memory.repairTargets = repairTargets;
	return ret;
}

Object.defineProperty(Room.prototype, 'buildTargets', {
	get: function() { return this.find(FIND_CONSTRUCTION_SITES); },
	enumerable: false,
	configurable: true
});

Room.prototype.nearestBuildTarget = function(x,y) {
	let targets = this.buildTargets;
	let min = 9999;
	let best = null;

	targets.forEach(target => {
		let dist = Math.abs(x - target.pos.x) + Math.abs(y - target.pos.y);
		if(dist < min) {
			min = dist;
			best = target;
		}
	});

	return best;
}

Object.defineProperty(Room.prototype, 'bestContainer', {
	get: function() {
		let max = 0;
		let best = null;
		this.find(FIND_MY_STRUCTURES, {filter: struct => struct.structureType === "container"}).forEach(container => {
			if(container.energy > max) {
				max = container.energy;
				best = container;
			}
		});
		return best;
	},
	enumerable: false,
	configurable: true
});
