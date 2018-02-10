module.exports = {
	start: function(task) {
		task.subtaskIndex = 0;
		task.subtask = [
			{name: "mini_move", action: "attack", target_id: task.target_id},
			{name: "mini_attack", target_id: task.target_id },
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

