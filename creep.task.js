Creep.task = {
	get_energy: require('creep.task.get_energy'),
	unload_energy: require('creep.task.unload_energy'),
	mine: require('creep.task.mine'),
	repair: require('creep.task.repair'),
	build: require('creep.task.build'),
	upgrade: require('creep.task.upgrade'),
	renew: require('creep.task.renew'),
	mini_mine: require('creep.task.mini.mine'),
	mini_move: require('creep.task.mini.move'),
	mini_repair: require('creep.task.mini.repair'),
	mini_build: require('creep.task.mini.build'),
	mini_upgrade: require('creep.task.mini.upgrade'),
	mini_renew: require('creep.task.mini.renew'),
}

Object.defineProperty(Creep.prototype, 'task', {
	get: function() { return this.memory.task; },
	enumerable: false,
	configurable: true
});

Creep.prototype.runSubTask = function(task) {
	let continue_task = "done";

	let init = false;
	if(typeof(task.subtaskIndex) === "undefined" ) {
		task.subtaskIndex = 0;
		init = true;
	}
	let subtask = task.subtask[task.subtaskIndex];
	if(init) Creep.task[subtask.name].start.bind(this)(subtask);

	if( subtask && subtask.name in Creep.task) {
		continue_task = Creep.task[subtask.name].run.bind(this)(subtask);
		if(continue_task === "done") {
			Creep.task[subtask.name].stop.bind(this)(subtask);
			continue_task = "continue";
			task.subtaskIndex++;
			if(task.subtask[task.subtaskIndex])
				Creep.task[task.subtask[task.subtaskIndex].name].start.bind(this)(subtask);
		} else if(continue_task === "fail") {
			Creep.task[subtask.name].stop.bind(this)(subtask);
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
