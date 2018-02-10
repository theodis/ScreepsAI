Room.NO_BUILD_RADIUS = 2;
Room.MAX_CONSTRUCTION_SITES = 80;
Room.UPDATE_BUILD_QUEUE_FREQUENCY = 1000;

Room.prototype.buildQueued = function(count) {
	let buildQueue = this.memory.buildQueue;
	let buildQueueTypeCount = this.memory.buildQueueTypeCount;
	while(count && buildQueue && buildQueue.length) {
		let cur = buildQueue.shift();
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
	else if(existingStruct.length && existingStruct[0].structureType !== STRUCTURE_ROAD) {}
	else {
		if(!buildQueueTypeCount[type]) buildQueueTypeCount[type] = 0;
		buildQueueTypeCount[type]++;
		buildQueue.push({x:pos.x, y:pos.y, type});
	}
}

Room.prototype.buildRoad = function(from, to, thickness = 0) {
	const costCallback = (rn, cm) => {
		let newCM = cm.clone();

		//Top and bottom
		for(let i = 0; i < Room.WIDTH; i++) {
			newCM.set(i,0,255)
			if(newCM.get(i,1) === 0) newCM.set(i,1,10)
			if(newCM.get(i,2) === 0) newCM.set(i,2,5)

			newCM.set(i,Room.HEIGHT - 1,255)
			if(newCM.get(i,Room.HEIGHT - 2) === 0) newCM.set(i,Room.HEIGHT - 2,10)
			if(newCM.get(i,Room.HEIGHT - 3) === 0) newCM.set(i,Room.HEIGHT - 3,5)
		}

		//Left and right
		for(let i = 0; i < Room.HEIGHT; i++) {
			newCM.set(0,i,255)
			if(newCM.get(1,i) === 0) newCM.set(1,i,10)
			if(newCM.get(2,i) === 0) newCM.set(2,i,5)

			newCM.set(Room.WIDTH - 1,i,255)
			if(newCM.get(Room.WIDTH - 2,i) === 0) newCM.set(Room.WIDTH - 2,i,10)
			if(newCM.get(Room.WIDTH - 3,i) === 0) newCM.set(Room.WIDTH - 3,i,5)
		}
		return newCM;
	}

	if(typeof from !== "RoomPosition") from = new RoomPosition(from.x, from.y, this.name);
	let path = from.findPathTo(to, {ignoreCreeps: true, costCallback});
	for(let pos of path) {
		this.queueConstruction({x: pos.x, y: pos.y}, STRUCTURE_ROAD);
		if(thickness) this.buildRoadAround(pos.x, pos.y,1,1,thickness);
	}
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
				this.queueConstruction({x: i, y: j}, STRUCTURE_ROAD);

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
		if(tile.type === "constructionSite" && tile.constructionSite.structureType !== STRUCTURE_ROAD) { valid = false; break;}
		if(tile.type === "structure" && tile.structure.structureType !== STRUCTURE_ROAD) { valid = false; break;}
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
		this.find(FIND_CONSTRUCTION_SITES).forEach(site => {
			if(!ret[site.structureType]) ret[site.structureType] = 0;
			ret[site.structureType]++;
		});
		this.find(FIND_STRUCTURES).forEach(site => {
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

	//Build containers
	Object.keys(spots).forEach(key => this.queueConstruction(spots[key], STRUCTURE_CONTAINER));

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
		this.buildRoad(roomPos, storageSpot, this.storage ? 1 : 0);
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

	//Build storage if high enough level
	if(remaining[STRUCTURE_STORAGE]) this.queueConstruction(storageSpot, STRUCTURE_STORAGE);

	//Build road from storage to controller
	this.buildRoad(storageSpot, this.controller.pos, this.storage ? 1 : 0);

	//Build as many towers with roads as possible
	for(let i = 0; i < remaining[STRUCTURE_TOWER]; i++) {
		let pos = this.getTowerSpot();
		this.queueConstruction(pos, STRUCTURE_TOWER);
		this.buildRoad(pos, storageSpot);
		this.buildRoadAround(pos.x, pos.y,1,1,1);

	}

	//Build as many extensions as possible
	let count = remaining[STRUCTURE_EXTENSION]

	while(count >= 4) {
		let pos = this.getFreeSpotNear(storageSpot.x,storageSpot.y,2,2,1);
		for(let j = 0; j < 2; j++)
			for(let i = 0; i < 2; i++)
				this.queueConstruction({x: pos.x + i, y: pos.y + j}, STRUCTURE_EXTENSION);
		this.buildRoad(pos, storageSpot);
		this.buildRoadAround(pos.x, pos.y,2,2,1);
		count -= 4;
	}

	//Build roads to exits and walls when controller is level 3
	if(this.controller.level >= 3) {
		this.exitRoadSpots.forEach(exit => this.buildRoad(storageSpot, exit));
		this.planWalls();
	}

	this.memory.lastBuildQueueUpdate = Game.time;
}

Room.prototype.planWalls = function() {
	const wallAt = (function(pos) { return this.lookForAt(LOOK_TERRAIN, pos.x, pos.y)[0] === "wall"; }).bind(this);
	function wallCheck(pos, vary, notvary, direction, awayDir) {
		if(wallAt(pos)) return true;
		let backpos = {}
		backpos[vary] = pos[vary] - direction;
		backpos[notvary] = pos[notvary] - awayDir;
		return wallAt(backpos);
	}

	let exitGroups = this.exitGroups;

	exitGroups.forEach(group => {
		let first = group[0];
		let last = group[group.length - 1];
		let buildStuff = [];

		//Get the bounds
		let min = {x: first.x, y: first.y};
		let max = {x: last.x, y: last.y};

		//Get the axis that varies
		let vary = min.x === max.x ? "y" : "x";
		let notvary = vary === "x" ? "y" : "x";

		//Direction away from border
		let awayDir = min[notvary] === 0 ? 1 : -1;

		//Move two away from border;
		min[notvary] += awayDir * 2;
		max[notvary] += awayDir * 2;

		//Extend vary axis until terrain wall encountered
		while(!wallCheck(min, vary, notvary, -1, awayDir) && min[vary] > 2) min[vary]--;

		//FIXME: Assuming square rooms of size 50
		while(!wallCheck(max, vary, notvary, 1, awayDir) && max[vary] < 47) max[vary]++;

		//Populate build stuff with walls initially
		for(let i = min[vary]; i <= max[vary]; i++) {
			let pos = {};
			pos[vary] = i;
			pos[notvary] = min[notvary];
			if(!wallAt(pos) && !this.lookForAt(LOOK_STRUCTURES, pos.x, pos.y).filter(struct => struct.structureType !== "road").length)
				buildStuff.push({pos, type: STRUCTURE_WALL});
		}

		//Replace walls at roads with ramparts
		for(let i in buildStuff) {
			let cur = buildStuff[i];
			//If any construction sites in the area then just wait for them to be finished
			if(this.lookForAt(LOOK_CONSTRUCTION_SITES, cur.pos.x, cur.pos.y).length) return;

			//If any structures replace this and any surrounding walls with ramparts
			let road = this.lookForAt(LOOK_STRUCTURES, cur.pos.x, cur.pos.y).filter(struct => struct.structureType === "road")
			if(road.length)
				buildStuff.forEach(build => { if(distance(cur,build) <= 1) build.type = STRUCTURE_RAMPART;} );
		}

		//Queue up the stuff to build
		buildStuff.forEach(build => this.queueConstruction({x: build.pos.x, y: build.pos.y}, build.type));
	})
}

Object.defineProperty(Room.prototype, 'exitGroups', {
	get: function () {
		let exitGroups = () => {
			function groupExits(positions, vertical) {
				if(!positions.length) return [];
				positions.sort((a,b) => vertical ? b.y - a.y : b.x - a.x);
				ret = [];
				curGroup = [];
				while(positions.length) {
					cur = positions.pop();
					last = curGroup.length ? curGroup[curGroup.length-1] : null;
					if(!last || (vertical ? cur.y === last.y + 1 : cur.x === last.x + 1))
						curGroup.push(cur);
					else {
						ret.push(curGroup);
						curGroup = [cur];
					}
				}
				ret.push(curGroup);
				return ret;
			}

			return [
				...groupExits(this.find(FIND_EXIT_TOP, false)),
				...groupExits(this.find(FIND_EXIT_BOTTOM), false),
				...groupExits(this.find(FIND_EXIT_LEFT), true),
				...groupExits(this.find(FIND_EXIT_RIGHT), true),
			];
		}

		return Memoize.get("exitGroups", exitGroups, this, 1000000);
	},
	enumerable: false,
	configurable: true
})

Object.defineProperty(Room.prototype, 'exitRoadSpots', {
	get: function() {
		let exitRoadSpots = () => this.exitGroups.map(group => {
			let first = group[0];
			let last = group[group.length-1];
			let avgx = Math.round((first.x + last.x)/2);
			let avgy = Math.round((first.y + last.y)/2);
			if(first.x === last.x) {
				//Vertical
				if(first.x === 0) {
					//Left
					avgx++;
				} else {
					//Right
					avgx--;
				}
			} else {
				//Horizontal
				if(first.y === 0) {
					//Top
					avgy++;
				} else {
					//Bottom
					avgy--;
				}
			}
			return new RoomPosition(avgx,avgy,this.name);
		})
		return Memoize.get("exitRoadSpots", exitRoadSpots, this, 1000000);
	},
	enumerable: false,
	configurable: true
})

Room.prototype.getExitRoadSpots = function(dir) {
	switch(dir) {
		case TOP:
			return this.exitRoadSpots.filter(spot => spot.y === 1);
		case RIGHT:
			return this.exitRoadSpots.filter(spot => spot.x === 48);
		case BOTTOM:
			return this.exitRoadSpots.filter(spot => spot.y === 48);
		case LEFT:
			return this.exitRoadSpots.filter(spot => spot.x === 1);
	}
	return [];
}
