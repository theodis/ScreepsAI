module.exports = {
	start: function(task) {
		task.subtaskIndex = 0;
		task.subtask = [
			{name: "mini_move", target_id: this.room.mainSpawn ? this.room.mainSpawn.id : Empire.mainSpawn.id , min_dist: 1},
			{name: "mini_renew" },
		]

		return true;
	},
	stop: function(task) {
		//No preconditions to stop
		return true;
	},
	run: function(task) {
		return this.runSubTask(task);
	},
};
