module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		function canCancel() {
			if(!target) return true;
			switch(task.action) {
				case "build":
					return target.progress === target.progressTotal;
				case "pickup":
					return target.amount < 50;
				case "withdraw":
					return target.store.energy === 0;
				case "repair":
					return target.hits === target.hitsMax;
				case "transfer":
					if(target.structureType) {
						switch(target.structureType) {
							case "spawn":
							case "extension":
								return target.energy === target.energyCapacity;
							case "container":
							case "storage":
								return target.store.energy === target.storeCapacity;
						}
					}
			}
		}

		let target = null;
		let pos = null;
		let min_dist = task.min_dist || 0;

		let action_params = task.action_params || [];
		if(task.target_id) target = Game.getObjectById(task.target_id);
		if(target) pos = target.pos; else pos = task;

		//If the action can be done then it's close enough
		if(target && task.action){
			if(!task.no_cancel && canCancel()) return "fail";
			let result = this[task.action](target, ...action_params);
			if(result === OK || result === ERR_FULL || result == ERR_INVALID_TARGET) return "done";
		}

		let dist = distance(this,pos);
		//If at the destination we're done
		if( dist <= min_dist ) return "done";

		//Otherwise move to target
		let result = null
		result = this.moveTo(pos.x, pos.y, {visualizePathStyle: {stroke: '#ffffff'}});
		task.last_result = result;
		if(result === ERR_NO_PATH || result === ERR_NO_BODYPART || result == ERR_INVALID_TARGET) return "fail";
		return "continue;"
	},
};
