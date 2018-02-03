// Get energy task looks for an available energy source
// and queues up appropriate mini tasks to get to it, if
// no energy is available, it fails to start.

module.exports = {
	start: function(task) {
		// Order to look for energy
		// 1.) Storage
		// 2.) Containers
		// 3.) Sources

		if(this.room.storage && this.room.storage.store.energy >= this.carryCapacity) {
			// Get energy from storage
			task.subtask = [
				{name: "mini_move", action: "withdraw", target_id: this.room.storage.id, action_params: [RESOURCE_ENERGY]},
			];
		} else if(this.room.bestContainer && this.room.bestContainer.store.energy >= this.carryCapacity) {
			// Get energy from best container
			task.subtask = [
				{name: "mini_move", action: "withdraw", target_id: this.room.bestContainer.id, action_params: [RESOURCE_ENERGY]},
			];
		} else if(this.memory.claim || this.room.peekClaimSourceMineSpot(this.carryCapacity)){
			//Grab a claim if don't already have one
			task.subtask = [ {name: "mine"} ];
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
