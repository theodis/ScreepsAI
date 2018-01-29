Creep.task = {
	get_energy: require('creep.task.get_energy'),
	repair: require('creep.task.repair'),
	build: require('creep.task.build'),
	mini_mine: require('creep.task.mini.mine'),
	mini_move: require('creep.task.mini.move'),
	mini_repair: require('creep.task.mini.repair'),
	mini_build: require('creep.task.mini.build'),
}

Object.defineProperty(Creep.prototype, 'task', {
	get: function() { return this.memory.task; },
	enumerable: false,
	configurable: true
});

Creep.prototype.runSubTask = function(task) {
	let continue_task = "done";
	let subtask = task.subtask[task.subtaskIndex];
	if( subtask && subtask.name in Creep.task) {
		continue_task = Creep.task[subtask.name].run.bind(this)(subtask);
		if(continue_task === "done") {
			continue_task = "continue";
			task.subtaskIndex++;
		}
	}

	return continue_task;
}

Creep.prototype.assignTask = function(newTask) {
	let oldTask = this.memory.task ? this.memory.task.name : "";
	if(newTask.name in Creep.task) {
		if(!(oldTask in Creep.task) || Creep.task[oldTask].stop.bind(this)(oldTask)) {
			if(Creep.task[newTask.name].start.bind(this)(newTask)) {
				this.memory.task = newTask;
				return true;
			} else {
				this.memory.task = null;
				return false;
			}
		} else {
			return false;
		}
	}
}
