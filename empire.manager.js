Empire = {};

require('empire.manager.recycler');

Empire.run = function() {
	Empire.recycle();
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
