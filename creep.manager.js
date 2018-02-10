require('creep.role');
require('creep.task');

Creep.prototype.run = function() {
	if((this.ticksToLive <= this.ticksToLiveRenew || this.hits < this.hitsMax * 0.75)) {
		this.drop("energy");
		this.assignTask({name: "renew"});
	}
	if(this.role in Creep.role) Creep.role[this.role].run.bind(this)();
	if(this.task && this.task.name in Creep.task) {
		let task_data = this.memory.task;
		let result = Creep.task[this.task.name].run.bind(this)(task_data);
		switch(result) {
			case "continue":
				this.memory.task = task_data;
				break;
			case "done":
			case "fail":
				this.memory.task = "";
		}
	};
}

Creep.prototype.getClaim = function() {
	if(!this.memory.claim) { this.memory.claim = this.room.claimSourceMineSpot(1, this); }
	return this.memory.claim;
}

Creep.prototype.revokeClaim = function() {
	let claim = this.memory.claim;
	if(claim) {
		let claimContainer = this.room.getClaimContainer(claim);
		if(claimContainer) this.memory.claimContainerID = claimContainer.id;
		this.room.unclaimSourceMineSpot(claim);
		delete this.memory.claim;
	}
}

Creep.getLoadOut = function(cost, weights, baseLoadout = []) {
	const sortOrder = {
		tough: 1,
		work: 2,
		attack: 3,
		ranged_attack: 4,
		heal: 5,
		claim: 6,
		carry: 7,
		move: 8,
	}
	let weightsum = {}
	let ret = []
	let totalcost = 0;

	function getNextPart() {
		let min = 9999;
		let next = null;
		for(let part in weightsum) {
			if(weightsum[part] < min){
				min = weightsum[part];
				next = part;
			}
		}
		return next;
	}

	function addPart(part) {
		if(totalcost + BODYPART_COST[part] > cost) return false;
		totalcost += BODYPART_COST[part];
		if(part in weights) weightsum[part] += 1 / weights[part];
		ret.push(part);
		return true;
	}

	Object.keys(weights).forEach(part => weightsum[part] = 0);
	baseLoadout.forEach(addPart);

	while(ret.length < 50 && (part = getNextPart())) if(!addPart(part)) delete weightsum[part];

	//Sort parts
	ret.sort((a,b) => sortOrder[a] - sortOrder[b]);

	return ret;
}

Object.defineProperty(Creep.prototype, 'worthKeeping', {
	get: function() {
		return Memoize.get("worthKeeping", () => {
				if(this.role === "reserver") return false;
				if(this.role === "worker" && this.room.workerCount > this.room.maxWorkers + 1 && this.room.workerCount > this.room.minWorkers)
					return false;
				return this.memory.buyCost === Creep.roleBestLoadoutCost[this.memory.role] || this.memory.buyCost >= this.room.energyCapacityAvailable * 0.8
			}
		, this, 100);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Creep.prototype, 'shouldRenew', {
	get: function() {
		return this.worthKeeping && this.memory.role !== "reserver" && this.ticksToLive <= 1500 - Math.floor(600/this.body.length);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Creep.prototype, 'ticksToLiveRenew', {
	get: function() {
		const ticksToLiveRenew = () => Math.max(100, (Empire.nearestSpawnDistance(this) + 1) * 60);
		return Memoize.get("ticksToLiveRenew", ticksToLiveRenew, this, 20);
	},
	enumerable: false,
	configurable: true
});
