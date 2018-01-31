Room.NO_BUILD_RADIUS = 2;
Room.MAX_CONSTRUCTION_SITES = 80;

Room.prototype.buildQueued = function(count) {
	let buildQueue = this.memory.buildQueue;
	let buildQueueTypeCount = this.memory.buildQueueTypeCount;
	while(count && buildQueue && buildQueue.length) {
		let cur = buildQueue.shift();
		this.createConstructionSite(new RoomPosition(cur.x,cur.y,this.name), type);
		buildQueueTypeCount[type]--;
		count--;
	}
}

Room.prototype.queueConstruction = function(pos, type) {
	if(!this.memory.buildQueue) this.memory.buildQueue = {};
	if(!this.memory.buildQueueTypeCount) this.memory.buildQueueTypeCount = {};
	let buildQueue = this.memory.buildQueue;
	let buildQueueTypeCount = this.memory.buildQueueTypeCount;
	buildQueue.push({x:pos.x, y:pos.y, type});
}

Room.prototype.buildRoad = function(from, to) {
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
		if(tile.type === "constructionSite" && inRadius(tile.x,tile.y) && tile.constructionType.structureType !== "road") { valid = false; break;}
		if(tile.type === "structure" && inArea(tile.x,tile.y)) { valid = false; break;}
		if(tile.type === "structure" && inRadius(tile.x,tile.y) && tile.structure.structureType !== "road") { valid = false; break;}
	}
	return valid;
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

