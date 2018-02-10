module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		let target = Game.getObjectById(task.target_id);
		let result = this.reserveController(target);
		if(result === OK) return "continue";
		return "fail";
	},
};
