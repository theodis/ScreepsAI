Creep.role = {
	carry: require('creep.role.carry'),
	cleanup: require('creep.role.cleanup'),
	miner: require('creep.role.miner'),
	reserver: require('creep.role.reserver'),
	scout: require('creep.role.scout'),
	worker: require('creep.role.worker'),
}

Creep.roleBaseLoadout = {
	carry: [MOVE, CARRY],
	cleanup: [MOVE, ATTACK],
	miner: [MOVE, CARRY, WORK, WORK],
	reserver: [MOVE, CLAIM],
	scout: [TOUGH, MOVE],
	worker: [MOVE, CARRY, WORK, WORK],
}

Creep.roleBaseLoadoutCost = {}
for(let role in Creep.roleBaseLoadout)
	Creep.roleBaseLoadoutCost[role] = creepCost(Creep.roleBaseLoadout[role]);

Creep.roleBestLoadout = {
	carry: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
	miner: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
	cleanup: [MOVE, ATTACK],
}

Creep.roleLoadoutWeights = {
	carry: {
		move: 1,
		carry: 2,
	},
	cleanup: {
		move: 1,
		attack: 1,
	},
	miner: {
		move: 1,
		carry: 1,
		work: 2,
	},
	reserver: {
		move: 1,
		claim: 1,
	},
	scout: {
		tough: 1,
		move: 1,
	},
	worker: {
		move: 1,
		carry: 1,
		work: 1,
	},
}

Creep.getRoleLoadout = function(role, cost) {
	//Make sure scouts get even move and tough;
	if(role === "scout") cost = Math.floor(cost / 60) * 60;
	if(role === "reserver") cost = Math.floor(cost / 650) * 650;
	if(Creep.roleBestLoadout[role] && (cost === 1000000 || cost >= Creep.roleBestLoadoutCost[role])) return Creep.roleBestLoadout[role];
	return Creep.getLoadOut(cost, Creep.roleLoadoutWeights[role], Creep.roleBaseLoadout[role]);
}

Object.defineProperty(Creep, 'roleBestLoadoutCost', {
	get: function() {
		if(!Creep._roleBestLoadoutCost) {
			Creep._roleBestLoadoutCost = {}
			for(let role in Creep.role)
				Creep._roleBestLoadoutCost[role] = creepCost(Creep.getRoleLoadout(role,1000000));
		}
		return Creep._roleBestLoadoutCost;
	},
	enumerable: false,
	configurable: true
});

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

