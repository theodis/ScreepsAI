global.username = _.find(Game.structures).owner.username;

require('utility');
require('room.manager');
require('creep.manager');

module.exports.loop = function () {
	Object.keys(Game.rooms).forEach(key => Game.rooms[key].run());
	Object.keys(Game.creeps).forEach(key => Game.creeps[key].run());
}
