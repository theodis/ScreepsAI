Room.NO_BUILD_RADIUS = 2;
Room.MAX_CONSTRUCTION_SITES = 80;
Room.UPDATE_BUILD_QUEUE_FREQUENCY = 1000;

Room.prototype.buildQueued = function(count) {
	let buildQueue = this.memory.buildQueue;
	let buildQueueTypeCount = this.memory.buildQueueTypeCount;
	while(count && buildQueue && buildQueue.length) {
		let cur = buildQueue.shift();
		let existingCons = this.lookForAt(LOOK_CONSTRUCTION_SITES, cur.x, cur.y);
		if(existingCons.length && existingCons[0].structureType === "road" && cur.type !== "road") existingCons[0].remove();
		this.createConstructionSite(new RoomPosition(cur.x,cur.y,this.name), cur.type);
		buildQueueTypeCount[cur.type]--;
		count--;
	}
}

Room.prototype.queueConstruction = function(pos, type) {
	let buildQueue = this.memory.buildQueue;
	let buildQueueTypeCount = this.memory.buildQueueTypeCount;
	let existingCons = this.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
	let existingStruct = this.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
	if(existingCons.length && existingCons[0].structureType === type) {}
	else if(existingStruct.length && existingStruct[0].structureType === type) {}
	else if(existingStruct.length && existingStruct[0].structureType !== "road") {}
	else {
		if(!buildQueueTypeCount[type]) buildQueueTypeCount[type] = 0;
		buildQueueTypeCount[type]++;
		buildQueue.push({x:pos.x, y:pos.y, type});
	}
}

Room.prototype.buildRoad = function(from, to) {
	if(typeof from !== "RoomPosition") from = new RoomPosition(from.x, from.y, this.name);
	let path = from.findPathTo(to);
	for(let pos of path)
		this.queueConstruction({x: pos.x, y: pos.y}, "road");
}

Room.prototype.buildRoadAround = function(x,y,width=1,height=1,radius=1) {
	if(radius < 1) return;
	let minx = x - radius;
	let miny = y - radius;
	let maxx = x + width - 1 + radius;
	let maxy = y + height - 1 + radius;
	for(let j = miny; j <= maxy; j++)
		for(let i = minx; i <= maxx; i++)
			if(!(i >= x && i <= x + width - 1 && j >= y && j <= y + height - 1))
				this.queueConstruction({x: i, y: j}, "road");

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
		if(tile.type === "constructionSite" && inArea(tile.x,tile.y)) { valid = false; break;}
		if(tile.type === "constructionSite" && inRadius(tile.x,tile.y) && tile.constructionSite.structureType !== "road") { valid = false; break;}
		if(tile.type === "structure" && inArea(tile.x,tile.y)) { valid = false; break;}
		if(tile.type === "structure" && inRadius(tile.x,tile.y) && tile.structure.structureType !== "road") { valid = false; break;}
	}
	return valid;
}

Object.defineProperty(Room.prototype, 'buildTargets', {
	get: function() { return this.find(FIND_MY_CONSTRUCTION_SITES); },
	enumerable: false,
	configurable: true
});

Room.prototype.nearestBuildTarget = function(x,y) {
	let targets = this.buildTargets;
	let min = 9999;
	let best = null;

	targets.forEach(target => {
		let dist = distance({x,y}, target);
		if(dist < min) {
			min = dist;
			best = target;
		}
	});

	return best;
}

Object.defineProperty(Room.prototype, 'buildingCount', {
	get: function() {
		let ret = {}
		this.find(FIND_MY_CONSTRUCTION_SITES).forEach(site => {
			if(!ret[site.structureType]) ret[site.structureType] = 0;
			ret[site.structureType]++;
		});
		this.find(FIND_MY_STRUCTURES).forEach(site => {
			if(!ret[site.structureType]) ret[site.structureType] = 0;
			ret[site.structureType]++;
		});
		return ret;
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'buildingsLeft', {
	get: function() {
		let ret = {}
		let current = this.buildingCount;
		let queued = this.memory.buildQueueTypeCount;
		let level = this.controller.level;

		for(let type in CONTROLLER_STRUCTURES)
			ret[type] = CONTROLLER_STRUCTURES[type][level] - (current[type] || 0) - (queued[type] || 0)
		return ret;
	},
	enumerable: false,
	configurable: true
})

Room.prototype.getTowerSpot = function() {
	//Stick tower near midpoint of exits and spawn
	let x = 0;
	let y = 0;
	let count = 0;
	this.findTypes([FIND_EXIT, FIND_MY_SPAWNS]).forEach(found => {
		x += found.pos ? found.pos.x : found.x;
		y += found.pos ? found.pos.y : found.y;
		count++;
	});

	let rx = Math.round(x/count);
	let ry = Math.round(y/count);
	rx = Math.min(Math.max(2,rx), 47);
	ry = Math.min(Math.max(2,ry), 47);
	return this.getFreeSpotNear(rx,ry,1,1,1);
}

Room.prototype.setUpBuildQueue = function() {
	if(this.memory.lastBuildQueueUpdate && Game.time < this.memory.lastBuildQueueUpdate + Room.UPDATE_BUILD_QUEUE_FREQUENCY)
		return;

	let remaining = this.buildingsLeft;
	let storageSpot = this.storageSpot; storageSpot = new RoomPosition(storageSpot.x, storageSpot.y, this.name);
	let spots = this.sourceContainerSpots;
	let mineSpots = this.sourceMineSpots;
	let spawn = this.mainSpawn;

	//Build order
	//Road from source mine spots to containers
	Object.keys(spots).forEach(key => {
		let pos = spots[key];
		let roomPos = new RoomPosition(pos.x,pos.y,this.name);

		//Road from container to mining spots
		mineSpots[key].forEach(mineSpot => {
			let mineSpotPos = new RoomPosition(mineSpot.x,mineSpot.y,this.name);
			this.buildRoad(mineSpotPos,roomPos);
		});
	});

	//Road from containers to storageSpot
	Object.keys(spots).forEach(key => {
		let pos = spots[key];
		let roomPos = new RoomPosition(pos.x,pos.y,this.name);
		this.buildRoad(roomPos, storageSpot);
	});

	//Road from storage to main spawn
	this.buildRoad(storageSpot, spawn.pos);

	//Road around containers
	Object.keys(spots).forEach(key => {
		let pos = spots[key];
		this.buildRoadAround(pos.x, pos.y);
	});

	//Road around stoarge
	this.buildRoadAround(storageSpot.x, storageSpot.y);

	//Road around spawn
	this.buildRoadAround(spawn.pos.x, spawn.pos.y);

	//Build containers
	Object.keys(spots).forEach(key => this.queueConstruction(spots[key], "container"));

	//Build storage if high enough level
	if(remaining["storage"]) this.queueConstruction(storageSpot, "storage");

	//Build road from storage to controller
	this.buildRoad(storageSpot, this.controller.pos);

	//Roads around controller
	this.buildRoadAround(this.controller.pos.x, this.controller.pos.y);

	//Build as many towers with roads as possible
	for(let i = 0; i < remaining["tower"]; i++) {
		let pos = this.getTowerSpot();
		this.buildRoad(pos, storageSpot);
		this.buildRoadAround(pos.x, pos.y,2,2,1);
		this.queueConstruction(pos, "tower");

	}

	//Build as many extensions as possible
	let count = remaining["extension"]

	while(count >= 4) {
		let pos = this.getFreeSpotNear(storageSpot.x,storageSpot.y,2,2,1);
		this.buildRoad(pos, storageSpot);
		this.buildRoadAround(pos.x, pos.y,2,2,1);
		for(let j = 0; j < 2; j++)
			for(let i = 0; i < 2; i++)
				this.queueConstruction({x: pos.x + i, y: pos.y + j}, "extension");
		count -= 4;
	}

	this.memory.lastBuildQueueUpdate = Game.time;
}
