module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		let target = null;
		let pos = null;
		let mindist = task.mindist || 0;

		let action_params = task.action_params || [];
		if(task.target_id) target = Game.getObjectById(task.target_id);
		if(target) pos = target.pos; else pos = task;

		//If the action can be done then it's close enough
		if(target && task.action){
			let result = this[task.action](target, ...action_params);
			if(result === OK || result === ERR_FULL || result == ERR_INVALID_TARGET) return "done";
		}

		let dist = Math.max(Math.abs(this.pos.x - pos.x), Math.abs(this.pos.y - pos.y));
		//If at the destination we're done
		if( dist <= mindist ) return "done";

		//Otherwise move to target
		let result = null
		result = this.moveTo(pos.x, pos.y, {visualizePathStyle: {stroke: '#ffffff'}});
		task.last_result = result;
		if(result === ERR_NO_PATH || result === ERR_NO_BODYPART || result == ERR_INVALID_TARGET) return "fail";
		return "continue;"
	},
};
