require('room.manager.mine');
require('room.manager.neutral');
require('room.manager.enemy');
require('room.manager.build');
require('room.manager.debug');
require('room.manager.source');

Room.WIDTH = 50;
Room.HEIGHT = 50;

Room.prototype.run = function() {
	if(this.mine) this.runMyRoom();
	else if(this.enemyStructures.length === 0) this.runNeutralRoom();
	else this.runEnemyRoom();
}

Room.prototype.findTypes = function(types, opts) {
	let ret = [];
	types.forEach(type => ret.push(...this.find(type,opts)));
	return ret;
}

Object.defineProperty(Room.prototype, 'creepsByRole', {
	get: function() {
		let creepsByRole = () => {
			let ret = {};
			this.creeps.forEach(creep => {
				if(!ret[creep.role]) ret[creep.role] = [];
				ret[creep.role].push(creep);
			});
			return ret;
		}
		return Memoize.get("creepsByRole", creepsByRole, this);
	},
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'creeps', {
	get: function() { return this.find(FIND_MY_CREEPS); },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'mine', {
	get: function() { return this.controller.owner.username === global.username },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'enemyStructures', {
	get: function() {
		return Memoize.get("enemyStructure", () => this.find(FIND_HOSTILE_STRUCTURES), this, 100);
	},
	enumerable: false,
	configurable: true
});

//TODO Make sure not to fix enemy structures!
Object.defineProperty(Room.prototype, 'repairTargets', {
	get: function() {
		let repairTargets = () => this.find(FIND_STRUCTURES, {filter: struct => struct.hits < struct.hitsRepair });
		return Memoize.get("repairTargets", repairTargets, this, 10);
	},
	enumerable: false,
	configurable: true
});
 
