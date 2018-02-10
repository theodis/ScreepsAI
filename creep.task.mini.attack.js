module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		let target = Game.getObjectById(task.target_id);
		if(!target) return "fail";
		let result = this.attack(target);
		if(result === OK) return "continue";
		return "fail";
	},
};
