module.exports = {
	start: function() {
		if(!this.memory.workRoom) this.memory.workRoom = this.room.name;
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		// Worker first needs energy to work withdraw
		// After getting energy worker has these priorities
		// 0.) Fill spawn if no cargo creeps
		// 1.) Upgrade if downgrade tick drop below 3k
		// 2.) Repair
		// 3.) Build
		// 4.) Upgrade

		// If none of the above are available to do or worker
		// can't get energy and there are sources to mine,
		// switch to a miner

		// If I already have a task then no need to continue;

		const mainSpawn = this.room.mainSpawn;
		if(this.task) {
			//Already busy
		} else if(this.room.name != this.memory.workRoom) {
			// Get to the right room
			this.assignTask({name: "mini_move", x: 25, y: 25, roomName: this.memory.workRoom, min_dist: 49 });
		} else if(this.carry.energy === 0) {
			this.assignTask({name: "get_energy"});
		} else if(this.room.controller.ticksToDowngrade < 3000) {
			this.assignTask({name: "upgrade", target_id: this.room.controller.id});
		} else if(!this.room.carryCount && mainSpawn.energy < mainSpawn.energyCapacity) {
			this.assignTask({name: "mini_move", action: "transfer", target_id: mainSpawn.id, action_params: [RESOURCE_ENERGY]});
		} else if(!this.room.carryCount && this.room.extensionsToFill.length) {
			let best = getNearest(this, this.room.extensionsToFill);
			this.assignTask({name: "mini_move", action: "transfer", target_id: best.id, action_params: [RESOURCE_ENERGY]});
		} else if(this.room.repairTargets.length) {
			this.assignTask({name: "repair", target_id: getNearest(this, this.room.repairTargets).id });
		} else if(this.room.buildTargets.length > 0) {
			this.assignTask({name: "build", target_id: this.room.nearestBuildTarget(this.pos.x, this.pos.y).id });
		} else if(this.room.storage && this.room.storage.store.energy < 10000) {
			this.assignTask({name: "mini_move", action: "transfer", target_id: this.room.storage.id, action_params: [RESOURCE_ENERGY]});
		} else if(this.room.fortifyTargets.length) {
			this.assignTask({name: "repair", target_id: getNearest(this, this.room.fortifyTargets).id });
		} else {
			this.assignTask({name: "upgrade", target_id: this.room.controller.id});
		}


	},
};
