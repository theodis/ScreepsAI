Creep.role = {
	carry: require('creep.role.carry'),
	miner: require('creep.role.miner'),
	worker: require('creep.role.worker'),
}

Creep.worker = require('creep.role.worker');

Creep.prototype.run = function() {
	if(this.role in Creep.role)
		Creep.role[this.role].run.bind(this)();
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

