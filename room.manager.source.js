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
		if(source.energy === source.energyCapacity && claimedRatio === 1) basescore *= 10;
		for(let ind of claims[id]) {
			let score = basescore;
			let creeps = this.lookForAt(LOOK_CREEPS, spot[ind].x, spot[ind].y);
			if(creeps.length && creeps[0] !== creep) continue;
			//FIXME bad hack
			spot[ind]["roomName"] = this.name;
			if(creep) score -= distance(spot[ind], creep) * 100;
			if(source.energy >= minEnergy && score > max && claims[id].length) {
				max = score;
				maxId = id;
				maxInd = ind;
			}
		}
	});

	if(maxId) {
		let pos = spots[maxId][maxInd];
		return { id: maxId, ind: maxInd, x: pos.x, y: pos.y, roomName: this.name }
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
	}
	return entry;
}

Room.prototype.unclaimSourceMineSpot = function(ret) {
	if(ret.roomName !== this.name && ret.roomName in Game.rooms) {
		Game.rooms[ret.roomName].unclaimSourceMineSpot(ret);
		return;
	}
	let spots = this.sourceMineSpots;
	let claims = this.sourceClaims;
	let spot = spots[ret.id];
	let claim = claims[ret.id];
	if(ret.ind < spot.length && claim.indexOf(ret.ind) === -1) {
		claim.push(ret.ind);
	}
}

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
						spots[source.id].push({x:tile.x, y:tile.y, roomName: this.name});
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

Object.defineProperty(Room.prototype, 'sourceMineSpotCount', {
	get: function() {
		let mineSpots = this.sourceMineSpots;
		let count = 0;
		for(let id in mineSpots) count += mineSpots[id].length;
		return count;
	},
	enumerable: false,
	configurable: true
})

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

Object.defineProperty(Room.prototype, 'sourceCount', {
	get: function() {
		return Memoize.get("sourceCount", () => this.find(FIND_SOURCES).length, this, 1000000);
	},
	enumerable: false,
	configurable: true
});

