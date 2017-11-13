var roleWorker = {

	/** @param {Creep} creep **/
	run: function(creep) {
		if(creep.carry.energy == 0) {
			creep.memory.targetID = null; //Reset target to find new work after using energy
			var sources = creep.room.find(FIND_MY_SPAWNS);
			if(sources[0].energy >= creep.carryCapacity / 3) {
				switch(creep.withdraw(sources[0], RESOURCE_ENERGY)) {
					case ERR_NOT_IN_RANGE:
						creep.moveTo(sources[0]);
						break;
					case ERR_NOT_ENOUGH_RESOURCES:
						creep.memory.role = "harvester";
						creep.say("🚧 harvester");
						break;
				}
			} else {
				creep.memory.role = "harvester";
				creep.say("🚧 harvester");
			}
		} else {
			let target = null;
			if(creep.memory.targetID) target = Game.getObjectById(creep.memory.targetID);
			//Find something to do
			if(!target) {
				//Can I repair stuff?
				let repairTargets = creep.room.find(FIND_STRUCTURES, {filter: struct => struct.hits < 4 * struct.hitsMax / 5});
				if(repairTargets.length) target = repairTargets[0];
			}

			//If nothing to repair then maybe build?
			if(!target) {
				let buildTargets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
				if(buildTargets.length) target = buildTargets[0];
			}

			//Still nothing to do?  Just upgrade then
			if(!target) target = creep.room.controller;
			creep.memory.targetID = target.id;

			let action = null;
			let isdone = null;
			if(target instanceof StructureController) { // Upgrade
				action = () => creep.upgradeController(target);
				isdone = () => false;
			} else if(target instanceof ConstructionSite) { // Build
				action = () => creep.build(target);
				isdone = () => target.progress >= target.progressTotal;
			} else if(target instanceof Structure) { //Repair
				action = () => creep.repair(target);
				isdone = () => target.hits >= target.hitsMax;
			} else {
				console.log(creep.name + " failed to get target action.");
			}

			if(action) {
				if(!isdone()) {
					switch(action()) {
						case OK:
							break;
						case ERR_NOT_IN_RANGE:
							creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
							break;

					}
				} else {
					//Already done so clear target
					creep.memory.targetID = null;
				}
			}
		}
	}
};

module.exports = roleWorker;
