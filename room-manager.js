Room.WIDTH = 50;
Room.HEIGHT = 50;
Room.NO_BUILD_RADIUS = 2;

Room.prototype.resetMemory = function() {Object.keys(this.memory).forEach(key => delete this.memory[key]); };

Room.prototype.run = function() {
	init = function() {
		//Plan out containers and initial roads
		let spawn = this.mainSpawn;
		let spots = this.sourceContainerSpots;
		let mineSpots = this.sourceMineSpots;

		Object.keys(spots).forEach(key => {
			let pos = spots[key].split(",");
			let roomPos = new RoomPosition(pos[0],pos[1],this.name);
			this.createConstructionSite(roomPos, "container");
		});

		//Build roads to sources mine spots
		Object.keys(mineSpots).forEach(key => {
			mineSpots[key].forEach(spot => {
				this.buildRoad(spawn.pos, new RoomPosition(spot[0],spot[1],this.name));
			})
		});

		//Put roads around spawn
		for(let j = spawn.pos.y - 1; j <= spawn.pos.y + 1 ; j++) {
			for(let i = spawn.pos.x - 1; i <= spawn.pos.x + 1 ; i++) {
				let roadPos = new RoomPosition(i,j,this.name);
				this.createConstructionSite(roadPos, "road");
			}
		}

		this.memory.initialized = true;

	}.bind(this);

	if(!this.memory.initialized) {
		init();
	}
}

Room.prototype.buildRoad = function(from, to) {
	let path = from.findPathTo(to);
	for(let pos of path) {
		if(this.lookForAt(LOOK_FLAGS,pos.x,pos.y).length === 0) {
			this.createConstructionSite(pos.x,pos.y, "road");
		}
	}
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
				ret = [rx, ry];
				break;
			}
		} else {
			//Ring loops
			//Top & Bottom
			for(let cx = rx; cx <= rx2; cx++) {
				if(this.isFreeSpot(cx,ry,width,height,radius)) {
					ret = [cx, ry];
					break;
				}
				if(this.isFreeSpot(cx,ry2,width,height,radius)) {
					ret = [cx, ry2];
					break;
				}
			}
			if(ret) break;

			//Left & Right
			for(let cy = ry + 1; cy <= ry2 - 1; cy++) {
				if(this.isFreeSpot(rx,cy,width,height,radius)) {
					ret = [rx, cy];
					break;
				}
				if(this.isFreeSpot(rx2,cy,width,height,radius)) {
					ret = [rx2, cy];
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
		this.memory.sourceClaims = JSON.stringify(claims);
		let pos = this.sourceMineSpots[maxId][ind];
		return { id: maxId, ind, x: pos[0], y: pos[1] }
	} else {
		return null;
	}
}

Room.prototype.unclaimSourceMineSpot = function(id, ind) {
	let spots = this.sourceMineSpots;
	let claims = this.sourceClaims;

	if(ind < spots[id].length && claims[id].indexOf(ind) == -1) {
		claims[id].push(ind);
		this.memory.sourceClaims = JSON.stringify(claims);
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
				this.createFlag(pos[0],pos[1],"Storage",COLOR_YELLOW);
				this.memory.storageSpot = pos[0] + "," + pos[1];
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
			let storageSpot = this.storageSpot.split(",");
			let spots = {};
			let sources = this.find(FIND_SOURCES);
			sources.forEach(source => {
				let flag = this.find(FIND_FLAGS, {filter: flag => flag === "SourceContainer:" + source.id});
				if(flag.length) {
					spots[source.id] = flag[0].pos.x + "," + flag[0].pos.y;
				} else {
					let path = source.pos.findPathTo(new RoomPosition(storageSpot[0],storageSpot[1],this.name));
					if(path.length >= 2);
					let pos = this.getFreeSpotNear(path[1].x,path[1].y,1,1,1);
					this.createFlag(pos[0],pos[1],"SourceContainer:" + source.id,COLOR_YELLOW);
					spots[source.id] = pos[0] + "," + pos[1];
				}
			});
			this.memory.sourceContainerSpots = JSON.stringify(spots);
		}
		return JSON.parse(this.memory.sourceContainerSpots);
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
						spots[source.id].push([tile.x, tile.y]);
					}
				});
			});
			this.memory.sourceMineSpots = JSON.stringify(spots);
			this.memory.sourceClaims = JSON.stringify(claims);
		}
		return JSON.parse(this.memory.sourceMineSpots);
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

/*module.exports.new = (room) => {
	if(!(room instanceof Room)) throw room + " isn't a room!";
	if(room.controller.owner.username != global.username) throw room + " isn't owned by current player!";
	let ret = {
	}
	return ret;
}*/

