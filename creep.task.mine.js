module.exports = {
	start: function(task) {
		let mineSpot = this.getClaim();
		if(!mineSpot) return false;
		task.subtask = [
			{name: "mini_move", x: mineSpot.x, y: mineSpot.y, roomName: mineSpot.roomName},
			{name: "mini_mine", target_id: mineSpot.id },
		];

		return true;
	},
	stop: function(task) {
		//No preconditions to stop
		this.revokeClaim();
		return true;
	},
	run: function(task) {
		return this.runSubTask(task);
	},
};
