Room.prototype.runMyRoom = function() {
	this.memory.type = "mine";

	const spawn = this.mainSpawn;

	const init = function() {
		console.log("Initializing room", this.name);
		//Initialize build queue
		this.memory.buildQueue = [];
		this.memory.buildQueueTypeCount = {};
		//Initialize room level
		this.memory.roomLevel = 1;

		//Plan out containers and initial roads

		//Flag storage
		let storageSpot = this.storageSpot; storageSpot = new RoomPosition(storageSpot.x, storageSpot.y, this.name);
		let spots = this.sourceContainerSpots;
		let mineSpots = this.sourceMineSpots;

		this.memory.initialized = true;

	}.bind(this);

	const levelUp = function(level) {
		console.log("Room leveled up",this.name, level);
		this.memory.lastBuildQueueUpdate = null;
		this.setUpBuildQueue();
	}.bind(this);

	const maintenance = function() {
		let constructionCount = this.find(FIND_CONSTRUCTION_SITES).length;
		if(constructionCount < Room.MAX_CONSTRUCTION_SITES) this.buildQueued(Room.MAX_CONSTRUCTION_SITES - constructionCount);
	}.bind(this);

	const handleTowers = function() {
		let towers = this.find(FIND_MY_STRUCTURES, {filter: struct => struct.structureType === "tower"});
		if(towers.length === 0) return;
		let enemies = this.find(FIND_HOSTILE_CREEPS);
		if(enemies.length) towers.forEach(tower => tower.attack(enemies[0]));
		else {
			let creeps = this.find(FIND_MY_CREEPS,{filter:creep => creep.hits < creep.hitsMax});
			if(creeps.length) towers.forEach(tower => tower.heal(creeps[0]));
		}
	}.bind(this);

	const loop = function() {
		if(!spawn.spawning) this.handleSpawns();

		//Maybe renew nearby creep
		if(!spawn.spawning) {
			let creeps = spawn.adjacentCreeps.filter(creep => creep.shouldRenew);
			let min = 9999;
			let max = 0;
			let mincreep = null;
			let maxcreep = null;
			creeps.forEach(creep => {
				if(creep.ticksToLive < min) {
					mincreep = creep;
					min = creep.ticksToLive;
				}
				if(creep.ticksToLive > max) {
					maxcreep = creep;
					max = creep.ticksToLive;
				}
			});
			let creep = mincreep ? (mincreep.ticksToLive < 200 ? mincreep : maxcreep) : null;
			if(creep) spawn.renewCreep(creep);
		}
		handleTowers();
	}.bind(this);

	if(!this.memory.initialized){
		if(global.lotsOfTime) init();
		else return; //Bail out if not enough time to initialize
	}
	while(this.memory.roomLevel < this.controller.level && global.lotsOfTime) levelUp(++this.memory.roomLevel);
	if(global.lotsOfTime) maintenance();
	if(global.lotsOfTime) this.setUpBuildQueue();
	loop();

}

Object.defineProperty(Room.prototype, 'workerCount', {
	get: function() {
		return this.creepsByRole["worker"] ? this.creepsByRole["worker"].length : 0;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'minWorkers', {
	get: function() {
		return 2;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'maxWorkers', {
	get: function() {
		let maxWorkers = () => {
			let extensionClusters = Math.floor(this.extensions.length / 4);
			let maxWorkers = 0;
			if(this.storage)
				maxWorkers = Math.round(this.storage.store.energy / 50000);
			else
				maxWorkers = Math.max(this.sourceMineSpotCount - extensionClusters / 2, this.minWorkers);
			return maxWorkers;
		}
		return Memoize.get("maxWorkers", maxWorkers, this, 10);
	},
	enumerable: false,
	configurable: true
});

Room.prototype.handleSpawns = function() {
	//Initially build one worker per source spot until miner creeps
	//When 2 containers are built, build one extentionless miner screep per source
	//If zero carry creeps, build one extentionless carry
	//If one carry wait for extensions to be full to make second
	//If two carries, replace mining creep with extention mining creep

	let creepsByRole = this.creepsByRole;
	let workers = creepsByRole["worker"] ? creepsByRole["worker"].length : 0;
	let miners = creepsByRole["miner"] ? creepsByRole["miner"].length : 0;
	let carrys = creepsByRole["carry"] ? creepsByRole["carry"].length : 0;

	if(this.energyAvailable < 300 || ((carrys > 0 || workers > 0) && this.energyAvailable < this.energyCapacityAvailable )) return;
	let containerCount = this.find(FIND_STRUCTURES, {filter: struct => struct.structureType === "container" }).length;

	let role = null;

	if(workers < Math.max(this.minWorkers, this.maxWorkers)) {
		role = "worker"
	} else if(containerCount == this.sourceCount && miners < this.sourceCount) {
		role = "miner"
	} else if(this.storage && carrys < 2) {
		role = "carry";
	}

	if(role) {
		let name = role + Game.time;
		let loadout = Creep.getRoleLoadout(role, this.energyAvailable);
		let buyCost = creepCost(loadout);
		let workRoom = this.name;
		this.mainSpawn.spawnCreep(loadout,name,{memory: {role, buyCost, workRoom} });
		console.log("Spawning", name);
	}

}

Object.defineProperty(Room.prototype, 'storageSpot', {
	get: function() {
		if(!this.mine) return null;
		if(!this.memory.storageSpot) {
			//Check if storage flag already planted
			let flag = this.find(FIND_FLAGS, {filter: flag => flag.name === "Storage"});
			if(flag.length) {
				this.memory.storageSpot = {x:flag[0].pos.x, y:flag[0].pos.y};
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
		return new RoomPosition(this.memory.storageSpot.x, this.memory.storageSpot.y , this.name);
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
					spots[source.id] = {x:flag[0].pos.x, y:flag[0].pos.y};
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

Object.defineProperty(Room.prototype, 'mainSpawn', {
	get: function() {
		if(!this.memory.mainSpawnID) {
			let mainSpawn = this.find(FIND_MY_SPAWNS)[0];
			if(mainSpawn) this.memory.mainSpawnID = mainSpawn.id;
		}
		return Game.getObjectById(this.memory.mainSpawnID);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'fortifyTargets', {
	get: function() {
		let fortifyTargets = () => this.find(FIND_STRUCTURES, {filter: struct => {
			return	(struct.structureType === STRUCTURE_WALL || struct.structureType === STRUCTURE_RAMPART) &&
				struct.hits < struct.hitsFortify;
		}});
		return Memoize.get("fortifyTargets", fortifyTargets, this, 10);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'bestContainer', {
	get: function() {
		let bestContainer = () => {
			let max = 199;
			let best = null;
			this.find(FIND_STRUCTURES, {filter: struct => struct.structureType === "container" }).forEach(container => {
				if(container.store.energy > max) {
					max = container.store.energy;
					best = container;
				}
			});
			return best;
		}
		return Memoize.get("bestContainer", bestContainer, this);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'towersToFill', {
	get: function() {
		let towersToFill = () => this.find(FIND_MY_STRUCTURES, {filter: struct => struct.structureType === "tower"}).find(tower => tower.energy < tower.energyCapacity);
		return Memoize.get("towersToFill", towersToFill, this);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'extensions', {
	get: function() {
		let extensions = () => this.find(FIND_MY_STRUCTURES, {filter: struct => struct.structureType === "extension" });
		return Memoize.get("extensions", extensions, this, 10);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'extensionsToFill', {
	get: function() {
		let extensionsToFill = () => this.extensions.filter(struct => struct.structureType === "extension" && struct.energy < struct.energyCapacity);
		return Memoize.get("extensionsToFill", extensionsToFill, this);
	},
	enumerable: false,
	configurable: true
});

