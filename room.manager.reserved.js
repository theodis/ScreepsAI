Room.prototype.runReservedRoom = function() {
	const maintenance = function() {
		let constructionCount = this.find(FIND_CONSTRUCTION_SITES).length;
		if(constructionCount < Room.MAX_CONSTRUCTION_SITES) this.buildQueued(Room.MAX_CONSTRUCTION_SITES - constructionCount);
	}.bind(this);

	this.memory.type = "reserved";

	this.memory.reservationTime = this.controller.reservation.ticksToEnd;

	this.setupReservedBuildQueue();
	maintenance();
}

Room.prototype.setupReservedBuildQueue = function() {
	if(this.memory.lastBuildQueueUpdate && Game.time < this.memory.lastBuildQueueUpdate + Room.UPDATE_BUILD_QUEUE_FREQUENCY)
		return;

	const sources = this.find(FIND_SOURCES);
	let nearestSpawn = Empire.nearestSpawn(this.name);
	let nearestSpawnDir = Game.map.findRoute(this.name, nearestSpawn.room.name)[0].exit;
	let exits = Game.map.describeExits(this.name);
	let exitRoadSpots = [];
	let nearestSpawnRoadSpots = [];

	let existingContainers = this.findTypes([FIND_CONSTRUCTION_SITES, FIND_STRUCTURES]).filter(struct => struct.structureType === STRUCTURE_CONTAINER);

	for(let dir in exits) {
		let m = Memory.rooms[exits[dir]];

		if(m.type === "mine" || m.type === "reserved") {
			let exitSpots = this.getExitRoadSpots(dir);
			exitRoadSpots.push(...exitSpots);
			if(dir == nearestSpawnDir) nearestSpawnRoadSpots.push(...exitSpots);
		}
	}

	// Build containers
	if(existingContainers.length < 5) {
		let ax = 0;
		let ay = 0;

		sources.forEach(source => {
			ax += source.pos.x;
			ay += source.pos.y;
		});

		ax = Math.round(ax / sources.length);
		ay = Math.round(ay / sources.length);

		let pos = this.getFreeSpotNear(ax,ay,1,1,0);
		this.queueConstruction(pos, STRUCTURE_CONTAINER);
	}

	// Build roads between exits
	exitRoadSpots.forEach(spota => {
		exitRoadSpots.forEach(spotb => {
			if(spota != spotb)
				this.buildRoad(spota, spotb);
		});
	});

	//Build roads to controller & container & each source
	nearestSpawnRoadSpots.forEach(spot => {
		this.buildRoad(spot, this.controller);
		if(existingContainers.length)
			this.buildRoad(spot, existingContainers[0]);
		sources.forEach(source => {
			this.buildRoad(spot, source);
		});
	})

	this.memory.lastBuildQueueUpdate = Game.time;
}

