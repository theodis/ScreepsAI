Empire = {};

require('empire.manager.recycler');

Empire.run = function() {
	Empire.recycle();
}

Empire.nearestSpawn = function(to) {
	//Support room names for debugging
	if(typeof to === "string") { to = new RoomPosition(25,25,to); }
	to = to.pos || to;

	let nearestSpawn = () => {
		let spawns = Object.keys(Game.rooms)
					.map(key => Game.rooms[key])
					.filter(room => room.mainSpawn)
					.map(room => room.mainSpawn);
		let min = -1;
		let best = null;
		spawns.forEach(spawn => {
			let dist = distance(spawn, to);
			if(!best || dist < min) {
				best = spawn;
				min = dist;
			}
		});

		return best;
	}

	return nearestSpawn();
}

Object.defineProperty(Empire, 'mainSpawn', {
	get: function() {
		let mainSpawn = () => Object.keys(Game.rooms)
					.map(key => Game.rooms[key])
					.reduce((accumulator, currentValue) => accumulator === null ? currentValue : (currentValue === null ? accumulator : (currentValue.energyCapacityAvailable > accumulator.energyCapacityAvailable ? currentValue : accumulator)))
					.mainSpawn;
		return Memoize.get("mainSpawn", mainSpawn, undefined, 100);
	},
	enumerable: false,
	configurable: true
});
