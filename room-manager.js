Room.WIDTH = 50;
Room.HEIGHT = 50;
Room.NO_BUILD_RADIUS = 2;
Room.MAX_CONSTRUCTION_SITES = 80;

Room.prototype.reset = function() {this.clear(); this.resetMemory();}
Room.prototype.resetMemory = function() {Object.keys(this.memory).forEach(key => delete this.memory[key]); };
Room.prototype.clear = function() {
	this.find(FIND_FLAGS).forEach(flag => flag.remove());
	this.find(FIND_CONSTRUCTION_SITES).forEach(site => site.remove());
};

Room.prototype.run = function() {
	const init = function() {
		console.log("Initializing room", this.name);
		//Initialize road queue
		this.memory.roadQueue = [];

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
		console.log("Room leveled up",room.name, level);
	}.bind(this);

	const maintenance = function() {
		let constructionCount = this.find(FIND_CONSTRUCTION_SITES).length;
		if(constructionCount < Room.MAX_CONSTRUCTION_SITES) this.buildQueuedRoads(Room.MAX_CONSTRUCTION_SITES - constructionCount);
	}.bind(this);

	const planning = function() {
	}.bind(this);

	const loop = function() {
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

Room.prototype.buildQueuedRoads = function(count) {
	let roadQueue = this.memory.roadQueue;
	while(count && roadQueue.length) {
		let pos = roadQueue.shift();
		this.createConstructionSite(new RoomPosition(pos.x,pos.y,this.name), "road");
		count--;
	}
	this.memory.roadQueue = roadQueue;
}

Room.prototype.queueRoad = function(pos) {
	let roadQueue = this.memory.roadQueue;
	roadQueue.push({x:pos.x, y:pos.y});
	this.memory.readQueue = roadQueue;
}

Room.prototype.buildRoad = function(from, to) {
	let roadQueue = this.memory.roadQueue;
	let path = from.findPathTo(to);
	for(let pos of path)
		roadQueue.push({x:pos.x, y:pos.y});
	this.memory.roadQueue = roadQueue;
}

Room.prototype.buildRoadAround = function(x,y,width=1,height=1,radius=1) {
	if(radius < 1) return;
	let minx = x - radius;
	let miny = y - radius;
	let maxx = x + width - 1 + radius;
	let maxy = y + height - 1 + radius;
	let roadQueue = this.memory.roadQueue;
	for(let j = miny; j <= maxy; j++)
		for(let i = minx; i <= maxx; i++)
			if(i < x && i > x + width - 1 && j < y && j > y + height - 1)
				roadQueue.push({x: i, y: j});
	this.memory.readQueue = roadQueue;
}

Room.prototype.getFreeSpotNear = function(x,y,width=1,height=1,radius=0) {
	let rx = x;
	let ry = y;
	let rx2 = x;
	let ry2 = y;

	let ret = null;
	while(!ret) {
		if(rx === rx2) {
			//Initial run
			if(this.isFreeSpot(rx,ry,width,height,radius)) {
				ret = {x:rx, y:ry};
				break;
			}
		} else {
			//Ring loops
			//Top & Bottom
			for(let cx = rx; cx <= rx2; cx++) {
				if(this.isFreeSpot(cx,ry,width,height,radius)) {
					ret = {x:cx, y:ry};
					break;
				}
				if(this.isFreeSpot(cx,ry2,width,height,radius)) {
					ret = {x:cx, y:ry2};
					break;
				}
			}
			if(ret) break;

			//Left & Right
			for(let cy = ry + 1; cy <= ry2 - 1; cy++) {
				if(this.isFreeSpot(rx,cy,width,height,radius)) {
					ret = {x:rx, y:cy};
					break;
				}
				if(this.isFreeSpot(rx2,cy,width,height,radius)) {
					ret = {x:rx2, y:cy};
					break;
				}
			}
		}

		//Expand the ring if possible
		let caps = 0;
		if(rx - radius > Room.NO_BUILD_RADIUS) rx--; else caps++;
		if(ry - radius > Room.NO_BUILD_RADIUS) ry--; else caps++;
		if(rx2 + width - 1 + radius < Room.WIDTH - Room.NO_BUILD_RADIUS - 1) rx2++; else caps++;
		if(ry2 + height - 1 + radius < Room.HEIGHT - Room.NO_BUILD_RADIUS - 1) ry2++; else caps++;

		if(caps === 4) break; //Break if not possible to expand ring in any direction
	}

	return ret;
};

Room.prototype.isFreeSpot = function(x,y,width=1,height=1,radius=0) {
	function inRadius(px, py) { return px < x || py < y || px > x + width - 1 || py > y + height - 1; }
	function inArea(px, py) { return !inRadius(px,py); }

	//Skip if too close to wall
	if(	x - radius < Room.NO_BUILD_RADIUS ||
		y - radius < Room.NO_BUILD_RADIUS ||
		x + width - 1 + radius >= Room.WIDTH - Room.NO_BUILD_RADIUS ||
		y + height - 1 + radius >= Room.HEIGHT - Room.NO_BUILD_RADIUS)
		return false;

	let tiles = this.lookAtArea(y - radius, x - radius, y + height - 1 + radius, x + width - 1 + radius, true);
	let valid = true;
	for(let tile of tiles) {
		if(tile.type === "terrain" && tile.terrain !== "swamp" && tile.terrain !== "plain") { valid = false; break;}
		if(tile.type === "flag") { valid = false; break;}
		if(tile.type === "constructionSite" && inArea(tile.pos.x,tile.pos.y)) { valid = false; break;}
		if(tile.type === "constructionSite" && inRadius(tile.pos.x,tile.pos.y) && tile.constructionType.structureType !== "road") { valid = false; break;}
		if(tile.type === "structure" && inArea(tile.pos.x,tile.pos.y)) { valid = false; break;}
		if(tile.type === "structure" && inRadius(tile.pos.x,tile.pos.y) && tile.structure.structureType !== "road") { valid = false; break;}
	}
	return valid;
}

Room.prototype.claimSourceMineSpot = function(minEnergy = 1, x = -1, y = -1) {
	let max = 0;
	let maxId = null;
	let claims = this.sourceClaims;

	Object.keys(claims).forEach(id => {
		let source = Game.getObjectById(id);
		if(source.energy >= minEnergy && source.energy > max && claims[id].length) {
			max = source.energy;
			maxId = source.id;
		}
	});

	if(maxId) {
		let ind = claims[maxId].pop();
		this.memory.sourceClaims = claims;
		let pos = this.sourceMineSpots[maxId][ind];
		return { id: maxId, ind, x: pos.x, y: pos.y }
	} else {
		return null;
	}
}

Room.prototype.unclaimSourceMineSpot = function(id, ind) {
	let spots = this.sourceMineSpots;
	let claims = this.sourceClaims;

	if(ind < spots[id].length && claims[id].indexOf(ind) == -1) {
		claims[id].push(ind);
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
		return JSON.parse(this.memory.sourceClaims);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'mainSpawn', {
	get: function() { return this.find(FIND_MY_SPAWNS, {filter: spawn => spawn.name === "MainSpawn"})[0] },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'mine', {
	get: function() { return this.controller.owner.username === global.username },
	enumerable: false,
	configurable: true
});

