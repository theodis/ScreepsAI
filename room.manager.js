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

	const loop = function() {
		const defaultWorkerLoadout = [WORK, WORK, CARRY, MOVE]
		if(!spawn.spawning && Object.keys(Game.creeps).length < 8) {
			let name = "Bob" + Game.time;
			spawn.spawnCreep(defaultWorkerLoadout,name,{memory: {role: "worker"}});
		}

		//Build workers until containers are built
		//Then build miners and cargo

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
		return this.memory.repairTargets;
	},
	enumerable: false,
	configurable: true
});

Room.prototype.getRepairTarget = function() {
	let repairTargets = this.repairTargets;
	if(!repairTargets.length) return null;

	let ret = Game.getObjectById(repairTarget.pop().id);
	return ret;
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
