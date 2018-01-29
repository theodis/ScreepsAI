module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		// Worker first needs energy to work withdraw
		// After getting energy worker has these priorities
		// 0.) Fill spawn if no cargo creeps
		// 1.) Repair
		// 2.) Build
		// 3.) Upgrade

		// If none of the above are available to do or worker
		// can't get energy and there are sources to mine,
		// switch to a miner

		// If I already have a task then no need to continue;
		if(this.ticksToLive < 5) { // Return claim and stop
			this.revokeClaim();
			return;
		}
		const mainSpawn = this.room.mainSpawn;
		if(this.task) {
			//Already busy
		} else if(this.carry.energy === 0) {
			this.assignTask({name: "get_energy"});
		} else if(!this.room.cargoCreeps && mainSpawn.energy < mainSpawn.energyCapacity) {
			this.assignTask({name: "mini_move", action: "transfer", target_id: mainSpawn.id, action_params: [RESOURCE_ENERGY]});
		} else if(this.room.repairTargetCount > 0) {
			this.assignTask({name: "repair", target_id: this.room.getRepairTarget().id});
		} else if(this.room.buildTargets.length > 0) {
			this.assignTask({name: "build", target_id: this.room.nearestBuildTarget(this.pos.x, this.pos.y).id });
		} else {
			this.assignTask({name: "upgrade", target_id: this.room.controller.id});
		}


	},
};
