module.exports = {
	start: function(task) {
		let mineSpot = this.getClaim();
		task.subtask = [
			{name: "mini_move", x: mineSpot.x, y: mineSpot.y},
			{name: "mini_mine", target_id: mineSpot.id },
		];

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
