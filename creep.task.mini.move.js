module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		let target = null;
		let action_params = task.action_params || [];
		if(task.target_id) target = Game.getObjectById(task.target_id);
		//If the action can be done then it's close enough
		if(target && task.action){
			let result = this[task.action](target, ...action_params);
			if(result === OK || result === ERR_FULL || result == ERR_INVALID_TARGET) return "done";
		}
		//If at the destination we're done
		if(
			(target && target.pos.x === this.pos.x && target.pos.y === this.pos.y) ||
			(task.x === this.pos.x && task.y === this.pos.y)
		) return "done";

		//Otherwise move to target
		let result = null
		if(target) result = this.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
		else result = this.moveTo(task.x, task.y, {visualizePathStyle: {stroke: '#ffffff'}});
		task.last_result = result;
		if(result === ERR_NO_PATH || result === ERR_NO_BODYPART || result == ERR_INVALID_TARGET) return "fail";
		return "continue;"
	},
};
