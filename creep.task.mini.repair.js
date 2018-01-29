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

		//Done if target is fully healed
		let target = Game.getObjectById(task.target_id);
		if(target.hits === target.hitsMax) return "done";

		let result = this.repair(target);
		if(result === OK) return "continue";
		return "fail";
	},
};
