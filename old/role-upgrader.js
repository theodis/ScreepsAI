var roleUpgrader = {

	/** @param {Creep} creep **/
	run: function(creep) {

		if(creep.memory.building && creep.carry.energy == 0) {
			creep.memory.building = false;
			creep.say('🔄 getting energy');
		}
		if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
		creep.memory.building = true;
		creep.say('🚧 build');
		}

		if(!creep.memory.building) {
			let sources = creep.room.find(FIND_MY_SPAWNS);
			if(sources[0].energy >= creep.carryCapacity) {
				switch(creep.withdraw(sources[0], RESOURCE_ENERGY)) {
					case ERR_NOT_IN_RANGE:
						creep.moveTo(sources[0]);
						break;
					case ERR_NOT_ENOUGH_RESOURCES:
						creep.memory.role = "harvester";
						creep.say("🚧 I'm a harvester now");
						break;
				}
			} else {
				creep.memory.role = "harvester";
				creep.say("🚧 I'm a harvester now");
			}
		}
		else {
			if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
				creep.moveTo(creep.room.controller);
			}
		}
	}
};

module.exports = roleUpgrader;
