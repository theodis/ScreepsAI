module.exports = {
	start: function(task) {

		let dest = task.dest || "storage"
		let dests = dest.split("|");
		let targets = this.room.find(FIND_STRUCTURES).filter(struct => dests.indexOf(struct.structureType) != -1  && struct.store.energy < struct.storeCapacity);
		let target = getNearest(this,targets);

		if(!target) return false;
		task.subtask = [
			{name: "mini_move", action: "transfer", target_id: target.id, action_params: [RESOURCE_ENERGY]},
		];

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
