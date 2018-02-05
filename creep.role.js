Creep.role = {
	carry: require('creep.role.carry'),
	miner: require('creep.role.miner'),
	worker: require('creep.role.worker'),
}

Creep.roleBaseLoadout = {
	carry: [MOVE, CARRY],
	miner: [MOVE, CARRY, WORK, WORK],
	worker: [MOVE, CARRY, WORK, WORK],
}

Creep.roleBaseLoadoutCost = {}
for(let role in Creep.roleBaseLoadout)
	Creep.roleBaseLoadoutCost[role] = creepCost(Creep.roleBaseLoadout[role]);

Creep.roleBestLoadout = {
	carry: [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY],
	miner: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK],
}

Creep.roleBestLoadoutCost = {}
for(let role in Creep.roleBestLoadout)
	Creep.roleBestLoadoutCost[role] = creepCost(Creep.roleBestLoadout[role]);

Creep.roleLoadoutWeights = {
	carry: {
		move: 1,
		carry: 1,
	},
	miner: {
		work: 2,
		carry: 1,
		move: 2,
	},
	worker: {
		work: 1,
		carry: 1,
		move: 2
	},
}

Creep.getRoleLoadout = function(role, cost) {
	return Creep.getLoadOut(cost, Creep.roleLoadoutWeights[role], Creep.roleBaseLoadout[role]);
}

Object.defineProperty(Creep.prototype, 'role', {
	get: function() { return this.memory.role; },
	set: function(newRole) {
		let oldRole = this.memory.role;
		if(newRole in Creep.role) {
			if(!(oldRole in Creep.role) || Creep.role[oldRole].stop.bind(this)()) {
				if(Creep.role[newRole].start.bind(this)()) {
					this.memory.role = newRole;
				} else {
					this.memory.role = "";
				}
			}
		}
	},
	enumerable: false,
	configurable: true
});

