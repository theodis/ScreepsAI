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
					return target.hits === target.hitsMax || (target.hitsFortify && target.hits >= target.hitsFortify);
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
		if(task.target_id) {
			target = Game.getObjectById(task.target_id);
			if(!target) return "fail";
		}

		if(target) pos = target.pos; else pos = new RoomPosition(task.x,task.y,task.roomName);

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

		if(this.room.name === pos.roomName || dist <= 100) {
			delete(task.temp_target_path);
			delete(task.temp_target_pos);
			result = this.moveTo(pos, {visualizePathStyle: {stroke: '#ffffff'}});
		} else {
			if(!task.temp_target_pos) {
				if(!task.temp_target_path || (!task.temp_target_pos && !task.temp_target_path.length)) {
					task.temp_target_path = Game.map.findRoute(this.room.name, pos.roomName, {routeCallback: avoidEnemyRoomsCallback});
					task.first_step = true;
				}
				if(!task.temp_target_pos || task.temp_target_pos.roomName !== this.room.name) {
					let path_part_ind = task.temp_target_path.findIndex(part => part.room === this.room.name);
					if(task.first_step) path_part_ind++;
					if(path_part_ind === -1) {
						delete(task.temp_target_path);
						delete(task.temp_target_pos);
					} else {
						if(task.first_step)
							delete(task.first_step);
						else
							path_part_ind++;
						//let temp_target_pos = getNearest(this, this.room.find(task.temp_target_path[path_part_ind].exit));
						//task.temp_target_pos = {x:temp_target_pos.x, y:temp_target_pos.y, roomName:temp_target_pos.roomName};
						task.temp_target_pos = {x:25, y:25, roomName:task.temp_target_path[path_part_ind+1].room};
					}
				}
			}
			if(task.temp_target_pos && distance(this, task.temp_target_pos) >= 20)  {
				let temp_target_pos = new RoomPosition(task.temp_target_pos.x, task.temp_target_pos.y, task.temp_target_pos.roomName);
				result = this.moveTo(temp_target_pos, {visualizePathStyle: {stroke: '#ffffff'}});
			} else {
				delete task.temp_target_pos;
			}
		}
		task.last_result = result;
		if(result === ERR_NO_PATH || result === ERR_NO_BODYPART || result == ERR_INVALID_TARGET) return "fail";
		return "continue;"
	},
};
