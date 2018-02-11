require('room.manager.mine');
require('room.manager.neutral');
require('room.manager.reserved');
require('room.manager.enemy');
require('room.manager.build');
require('room.manager.debug');
require('room.manager.source');

Room.WIDTH = 50;
Room.HEIGHT = 50;

Room.prototype.run = function() {
	this.updateVisited();
	if(!this.mine) this.basicScoutInfo();
	if(this.mine) this.runMyRoom();
	else if(this.enemyStructures.length === 0 && (!this.controller || !this.controller.reservation)) this.runNeutralRoom();
	else if(this.controller && this.controller.reservation && this.controller.reservation.username === username) this.runReservedRoom();
	else this.runEnemyRoom();
}

Room.prototype.basicScoutInfo = function() {
	const reduceAttackParts = (acc, cv) => acc += (cv.type == ATTACK || cv.type == RANGED_ATTACK) ? 1 : 0;
	const reduceAttackCreeps = (acc, cv) => acc += cv.body.reduce(reduceAttackParts, 0);
	if(!this.memory.sourceCount) this.memory.sourceCount = this.sourceCount;
	let enemyCreeps = this.find(FIND_HOSTILE_CREEPS);
	let enemyStructures = this.enemyStructures;
	this.memory.enemyStructureCount = enemyStructures.length;
	this.memory.enemyTowerCount = enemyStructures.filter(struct => struct.structureType === STRUCTURE_TOWER).length;
	this.memory.enemyCreeps = enemyCreeps.length;
	this.memory.enemyAttackParts = enemyCreeps.reduce(reduceAttackCreeps,0);

	if(this.controller) {
		this.memory.safeMode = this.controller.safeMode;
		this.memory.safeModeAvailable = this.controller.safeModeAvailable;
		this.memory.safeModeCooldown = this.controller.safeModeCooldown;
	}
}

Room.prototype.updateVisited = function() {
	//Update last visited time
	Empire.lastVisited[this.name] = Game.time;

	//Clear unvisited flag if necessary
	if(this.name in Empire.unvisited) delete Empire.unvisited[this.name];

	//Update unvitied
	this.exits.forEach(exit => {
		if(!(exit in Empire.lastVisited)) Empire.unvisited[exit] = true;
	});
}

Object.defineProperty(Room.prototype, 'exits', {
	get: function() {
		let exits = () => {
			let exits = Game.map.describeExits(this.name);
			return Object.keys(exits).map(dir => exits[dir]);
		}
		return Memoize.get("exits", exits, this, 1000000);
	},
	enumerable: false,
	configurable: true
});

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

Object.defineProperty(Room.prototype, 'carryCount', {
	get: function() { return this.creepsByRole["carry"] || 0; },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'creeps', {
	get: function() { return this.find(FIND_MY_CREEPS); },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'mine', {
	get: function() { return this.controller && this.controller.owner && this.controller.owner.username === global.username },
	enumerable: false,
	configurable: true
});

Object.defineProperty(Room.prototype, 'enemyStructures', {
	get: function() {
		return Memoize.get("enemyStructure", () => this.find(FIND_HOSTILE_STRUCTURES), this);
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
 
