global.username = _.find(Game.structures).owner.username;

require('utility');
var roomManagerFactory = require('room.manager');

module.exports.loop = function () {
	Object.keys(Game.rooms).forEach(key => Game.rooms[key].run());
}
