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
	carry: [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
	miner: [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK],
}

Creep.roleBestLoadoutCost = {}
for(let role in Creep.roleBestLoadout)
	Creep.roleBestLoadoutCost[role] = creepCost(Creep.roleBestLoadout[role]);

Creep.roleLoadoutWeights = {
	carry: {
		move: 1,
		carry: 2,
	},
	miner: {
		move: 1,
		carry: 1,
		work: 2,
	},
	worker: {
		move: 1,
		carry: 1,
		work: 1,
	},
}

Creep.getRoleLoadout = function(role, cost) {
	if(Creep.roleBestLoadoutCost[role] && Creep.roleBestLoadoutCost[role] <= cost) return Creep.roleBestLoadout[role];
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

