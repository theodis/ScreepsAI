var roomManagerFactory = require('room.manager');

var roleHarvester = {

	/** @param {Creep} creep **/
	run: function(creep) {
		let roomManager = roomManagerFactory.new(creep.room);
		let spot = creep.memory.energySpot;
		if(creep.ticksToLive <= 1) {
			if(spot) roomManager.returnEnergySpot(spot);
			return;
		}
		if(creep.carry.energy < creep.carryCapacity) {
			if(!spot) {
				spot = roomManager.getAvailableEnergySpot();
				creep.memory.energySpot = spot;
				if(spot) creep.say("🚧 mining");
			}

			if(spot) {
				let source = Game.getObjectById(spot.id);
				if(creep.pos.x != spot.x || creep.pos.y != spot.y) {
					let position = creep.room.getPositionAt(spot.x, spot.y);
					creep.moveTo(position, {visualizePathStyle: {stroke: '#ffffff'}});
				} else {
					switch(creep.harvest(source)) {
						case OK:

							break;
					}
				}

			} else {
				if(Game.spawns['Spawn1'].energy > creep.carryCapacity) {
					creep.memory.role = "worker";
					creep.say("🚧 worker");
				} else {
					creep.say("no mining spot");
				}
			}
		} else {
			if(spot) {
				creep.memory.energySpot = null;
				roomManager.returnEnergySpot(spot);
			}
			switch(creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY)){
				case ERR_NOT_IN_RANGE:
					creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
					creep.moveTo(Game.spawns['Spawn1'], {visualizePathStyle: {stroke: '#ffffff'}});
					creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
					break;
			}
		}
	}
};

module.exports = roleHarvester;
