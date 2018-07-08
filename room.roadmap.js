Room.ROADMAP_REDUCE = 1;
Room.ROADMAP_INCREASE = 100;
Room.ROADMAP_ROAD_MIN = 200;
Room.ROADMAP_MAX = 2000;

Room.prototype.updateRoadMap = function() {
	// Initialize room map in memory if needed
	if(!this.memory.roadMap) {
		this.memory.roadMap = new Array(Room.HEIGHT);
		for(let j = 0; j < Room.HEIGHT; j++) {
			this.memory.roadMap[j] = new Array(Room.WIDTH);
			for(let i = 0; i < Room.WIDTH; i++) this.memory.roadMap[j][i] = 0;
		}
	}

	//Reduce existing amounts
	for(let j = 0; j < Room.HEIGHT; j++)
		for(let i = 0; i < Room.WIDTH; i++)
			this.memory.roadMap[j][i] =
				Math.max(this.memory.roadMap[j][i] - Room.ROADMAP_REDUCE, 0);

	//Increase where friendly creeps are at
	this.find(FIND_MY_CREEPS).forEach(creep => {
		this.memory.roadMap[creep.pos.y][creep.pos.x] =
			Math.min(this.memory.roadMap[creep.pos.y][creep.pos.x] + Room.ROADMAP_INCREASE, Room.ROADMAP_MAX);
	});
}

Room.prototype.roadMapRoadAt = function(x,y) {
	return this.memory.roadMap[y,x] >= Room.ROADMAP_ROAD_MIN;
}

Room.prototype.roadMapRoads = function() {
	const ret = [];
	for(let j = 0; j < Room.HEIGHT; j++)
		for(let i = 0; i < Room.WIDTH; i++)
			if(this.memory.roadMap[j][i] >= Room.ROADMAP_ROAD_MIN)
				ret.push({x: i, y: j});
	return ret;
}
