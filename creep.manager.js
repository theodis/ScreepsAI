require('creep.role');
require('creep.task');

Creep.prototype.run = function() {
	if(this.role in Creep.role) Creep.role[this.role].run.bind(this)();
	if(this.task && this.task.name in Creep.task) {
		let task_data = this.memory.task;
		let result = Creep.task[this.task.name].run.bind(this)(task_data);
		switch(result) {
			case "continue":
				this.memory.task = task_data;
				break;
			case "done":
			case "fail":
				this.memory.task = "";
		}
	};
}

Creep.prototype.revokeClaim = function() {
	let claim = this.memory.claim;
	if(claim) {
		this.room.unclaimSourceMineSpot(claim);
		this.memory.claim = null;
		delete this.memory.claim;
	}
}

