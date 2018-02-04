require('room.manager.build');
require('room.manager.debug');
require('room.manager.source');

Room.WIDTH = 50;
Room.HEIGHT = 50;

Room.prototype.run = function() {
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
	}.bind(this);

	const maintenance = function() {
		let constructionCount = this.find(FIND_CONSTRUCTION_SITES).length;
		if(constructionCount < Room.MAX_CONSTRUCTION_SITES) this.buildQueued(Room.MAX_CONSTRUCTION_SITES - constructionCount);
	}.bind(this);

	const planning = function() {
	}.bind(this);

	const handleTowers = function() {
		let towers = this.find(FIND_MY_STRUCTURES, {filter: struct => struct.structureType === "tower"});
		if(towers.length === 0) return;
		let enemies = this.find(FIND_HOSTILE_CREEPS);
		if(enemies.length) towers.forEach(tower => tower.attack(enemies[0]));
	}.bind(this);

	const loop = function() {
		if(!spawn.spawning) this.handleSpawns();

		//Maybe renew nearby creep
		if(!spawn.spawning) {
			let creeps = spawn.adjacentCreeps.filter(creep => creep.shouldRenew);
			let min = 9999;
			let creep = null;
			creeps.forEach(creepi => {
				if(creepi.ticksToLive < min){
					creep = creepi;
					min = creepi.ticksToLive;
				}
			});
			if(creep) spawn.renewCreep(creep);
		}
		handleTowers();

		this.setUpBuildQueue();
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

	if(this.energyAvailable < 300 || (carrys > 0 && this.energyAvailable < this.energyCapacityAvailable )) return;
	let sourceCount = this.find(FIND_SOURCES).length;

	let maxWorkers = 0;
	if(this.storage) maxWorkers = Math.max(Math.round(this.storage.store.energy / 50000), 2);

	let name = null;
	let role = null;

	if(miners == 0 && carrys == 0 && workers < 8) {
		name = "BasicWorker" + Game.time;
		role = "worker"
	} else if(miners < sourceCount + 1) {
		name = "Miner" + Game.time;
		role = "miner"
	} else if(carrys < sourceCount) {
		name = "Carry" + Game.time;
		role = "carry";
	} else if(workers < maxWorkers) {
		name = "Worker" + Game.time;
		role = "worker";
	}

	if(name) {
		let loadout = Creep.getRoleLoadout(role, this.energyAvailable);
		this.mainSpawn.spawnCreep(loadout,name,{memory: {role, energyAvailable: this.energyAvailable}});
		console.log("Spawning", name);
	}

}

Room.prototype.findTypes = function(types, opts) {
	let ret = [];
	types.forEach(type => ret.push(...this.find(type,opts)));
	return ret;
}

Object.defineProperty(Room.prototype, 'creepsByRole', {
	get: function() {
		let ret = {};
		this.creeps.forEach(creep => {
			if(!ret[creep.role]) ret[creep.role] = [];
			ret[creep.role].push(creep);
		});
		return ret;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'creeps', {
	get: function() { return this.find(FIND_MY_CREEPS); },
	enumerable: false,
	configurable: true
});

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
		if(!this.memory.mainSpawnID)
			this.memory.mainSpawnID = this.find(FIND_MY_SPAWNS, {filter: spawn => spawn.name === `MainSpawn:${this.name}`})[0].id;
		return Game.getObjectById(this.memory.mainSpawnID);
	},
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
		return this.repairTargets.length;
	},
	enumerable: false,
	configurable: true
});

//TODO Make sure not to fix enemy structures!
Object.defineProperty(Room.prototype, 'repairTargets', {
	get: function() {
		return this.find(FIND_STRUCTURES, {filter: struct => struct.hits < struct.hitsMax / 2 });
	},
	enumerable: false,
	configurable: true
});

Room.prototype.getRepairTarget = function(pos) {
	let repairTargets = this.repairTargets;
	if(!repairTargets.length) return null;
	let ret = null;
	if(pos) {
		let min = 99999;

		repairTargets.forEach(target => {
			let dist = Math.max(Math.abs(pos.x - target.pos.x), Math.abs(pos.y - target.pos.y));
			if(dist < min) {
				min = dist;
				ret = target;
			}
		})
	} else {
		ret = repairTargets[0];
	}
	return ret;
}

Object.defineProperty(Room.prototype, 'bestContainer', {
	get: function() {
		let max = 0;
		let best = null;
		this.find(FIND_STRUCTURES, {filter: struct => struct.structureType === "container" }).forEach(container => {
			if(container.store.energy > max) {
				max = container.store.energy;
				best = container;
			}
		});
		return best;
	},
	enumerable: false,
	configurable: true
});
