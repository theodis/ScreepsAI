Creep.role = {
	carry: require('creep.role.carry'),
	miner: require('creep.role.miner'),
	worker: require('creep.role.worker'),
}

Creep.roleBaseLoadout = {
	carry: [MOVE, CARRY],
	miner: [MOVE, CARRY, WORK],
	worker: [MOVE, CARRY, WORK],
}

Creep.roleLoadoutWeights = {
	carry: {
		move: 1,
		carry: 1,
	},
	miner: {
		work: 5,
		carry: 1,
	},
	worker: {
		work: 1,
		carry: 1,
		move: 1
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

