global.username = _.find(Game.structures).owner.username;

var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleWorker = require('role.worker');
var roomManagerFactory = require('room.manager');

function roleCount(role) {
	let ret = 0;
	for(var name in Game.creeps) {
		var creep = Game.creeps[name];
		if(creep.memory.role == role) ret++;
	}

	return ret;
}

function freeName(role) {
	let name = null;
	let count = 0;
	do {
		name = role + count++;
	} while (name in Game.creeps)
	return name;
}

function spawnCreep(spawner, loadout, role) {
	spawner.spawnCreep( loadout, freeName(role), { memory: { role} } );
}

const defaultWorkerLoadout = [WORK, CARRY, CARRY, MOVE]

module.exports.loop = function () {
	const roomManagers = Object.values(Game.rooms).map(room => roomManagerFactory.new(room));
	const roomManager = roomManagers[0];

	for(var name in Game.creeps) {
		var creep = Game.creeps[name];
		if(creep.memory.role == 'harvester') {
			roleHarvester.run(creep);
		}
		if(creep.memory.role == 'upgrader') {
			roleUpgrader.run(creep);
		}
		if(creep.memory.role == 'builder') {
			roleBuilder.run(creep);
		}
		if(creep.memory.role == 'worker') {
			roleWorker.run(creep);
		}
	}

	let spawner = Game.spawns['Spawn1'];

	if(!spawner.spawning) {
		//If we have less than two harvesters then make more
		if(Object.keys(Game.creeps).length < 2)
			spawnCreep(spawner, defaultWorkerLoadout, "harvester");

		//If we've hit capacity then we can afford more workers
		if(spawner.energy == spawner.energyCapacity && roomManager.availableEnergySpots().length )
			spawnCreep(spawner, defaultWorkerLoadout, "worker");
	}
}
