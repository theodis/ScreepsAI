global.username = _.find(Game.structures).owner.username;

require('utility');
require('memoize.manager');
require('empire.manager');
require('room.manager');
require('creep.manager');
require('spawn.manager');
require('structure.manager');

module.exports.loop = function () {

	//Keep bucket to a minimum of 100
	if(Game.cpu.bucket < 100) return;

	//Memoization init
	if(!global.creeps) global.creeps = {}
	for(let id in Game.creeps) if(!global.creeps[id]) global.creeps[id] = {}
	if(!global.rooms) global.rooms = {}
	for(let name in Game.rooms) if(!global.rooms[name]) global.rooms[name] = {}

	Object.keys(Game.rooms).forEach(key => Game.rooms[key].run());
	Object.keys(Game.creeps).forEach(key => Game.creeps[key].run());
	Empire.recycle();
}

