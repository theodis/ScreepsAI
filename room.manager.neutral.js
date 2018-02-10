Room.prototype.runNeutralRoom = function() {
	this.memory.type = "neutral";
}

Room.prototype.setUpNeutralBuildQueue = function() {
	if(this.memory.lastBuildQueueUpdate && Game.time < this.memory.lastBuildQueueUpdate + Room.UPDATE_BUILD_QUEUE_FREQUENCY)
		return;

	// Build containers
	const containerFlags = this.find(FIND_FLAGS).filter(flag => flag.name === "container");
	const sources = this.find(FIND_SOURCES);
	const maxContainers = 5;

	if(!containerFlags.length && sources.length) {
		const containersPerSource = Math.floor(maxContainers / sources.length);
		const containerRemainer = maxContainers - containersPerSource * sources.length;

		this.memory.lastBuildQueueUpdate = Game.time;
	}
}
