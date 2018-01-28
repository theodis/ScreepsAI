module.exports.new = (room) => {
	if(!(room instanceof Room)) throw room + " isn't a room!";
	if(room.controller.owner.username != global.username) throw room + " isn't owned by current player!";
	let ret = {
		room,
		init: function() {
			if(!room.memory.foundEnergySpots) {
				let sources = room.find(FIND_SOURCES);
				let spots = [];
				sources.forEach(source => {
					let tiles = room.lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
					tiles.forEach(tile => {
						if(tile.type == "terrain" && (tile.terrain == "swamp" || tile.terrain == "plain"))
							spots.push({ x: tile.x, y: tile.y, id: source.id });
					});
				});
				room.memory.foundEnergySpots = true;
				room.memory.availableEnergySpots = spots;
			}
		},
		availableEnergySpots: function() { return room.memory.availableEnergySpots; },
		getAvailableEnergySpot: function() { return room.memory.availableEnergySpots.length ? room.memory.availableEnergySpots.pop() : null},
		returnEnergySpot: function(spot) { room.memory.availableEnergySpots.push(spot); },
	}
	ret.init();
	return ret;
} 
