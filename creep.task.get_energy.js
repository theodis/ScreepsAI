// Get energy task looks for an available energy source
// and queues up appropriate mini tasks to get to it, if
// no energy is available, it fails to start.

module.exports = {
	start: function(task) {
		// Order to look for energy
		// 1.) Storage
		// 2.) Containers
		// 3.) Sources

		task.subtaskIndex = 0;
		if(this.room.storage && this.room.storage.energy >= this.carryCapacity) {
			// Get energy from storage
			task.subtask = [
				{name: "mini_move", action: "withdraw", target_id: this.room.storage.id, action_params: [RESOURCE_ENERGY]},
			];
		} else if(this.room.bestContainer && this.room.bestConainter.energy >= this.carryCapacity) {
			// Get energy from best container
			task.subtask = [
				{name: "mini_move", action: "withdraw", target_id: this.room.bestConainter.id, action_params: [RESOURCE_ENERGY]},
			];
		} else if(this.room.peekClaimSourceMineSpot(this.carryCapacity)){

			//Grab a claim if don't already have one
			let mineSpot = null;
			if(!this.memory.claim) this.memory.claim = this.room.claimSourceMineSpot(this.carryCapacity, this.pos.x, this.pos.y);
			mineSpot = this.memory.claim;
			if(mineSpot === null) return false;

			task.subtask = [
				{name: "mini_move", x: mineSpot.x, y: mineSpot.y},
				{name: "mini_mine", target_id: mineSpot.id },
			];
		} else {
			return false; //Nowhere to get energy
		}

		//Save subtask info for running
		return true;
	},
	stop: function(task) {
		return true;
	},
	run: function(task) {
		return this.runSubTask(task);
	},
};
