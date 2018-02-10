module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		//Done if ran out of energy
		if(this.carry.energy === 0) return "done";

		let target = Game.getObjectById(task.target_id);
		if(!target) return "fail";
		let result = this.attack(target);
		if(target.progress === target.progressTotal) return "done";
		if(result === OK) return "continue";
		return "fail";
	},
};
