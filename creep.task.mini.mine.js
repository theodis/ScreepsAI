module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		//Done if full
		let claim = this.memory.claim;
		if(this.carry.energy === this.carryCapacity) {
			this.room.unclaimSourceMineSpot(claim);
			delete(this.memory.claim);
			return "done";
		}

		let target = Game.getObjectById(task.target_id);
		let result = this.harvest(target);
		if(result === OK) return "continue";

		this.room.unclaimSourceMineSpot(claim);
		delete(this.memory.claim);
		return "fail";
	},
};
