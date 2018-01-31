module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		//Done if full
		if(this.carry.energy === this.carryCapacity) {
			this.revokeClaim();
			return "done";
		}

		let target = Game.getObjectById(task.target_id);
		let result = this.harvest(target);
		if(result === OK) return "continue";

		this.revokeClaim();
		return "fail";
	},
};