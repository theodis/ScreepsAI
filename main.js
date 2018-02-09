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

	Object.keys(Game.rooms).forEach(key => Game.rooms[key].run());
	Object.keys(Game.creeps).forEach(key => Game.creeps[key].run());
	Empire.recycle();
}

