global.username = _.find(Game.structures).owner.username;

require('utility');
require('empire.manager');
require('room.manager');
require('creep.manager');
require('spawn.manager');
require('structure.manager');

module.exports.loop = function () {
	//TODO clean up repair mess
	if(!global.repairs) {
		console.log("Global repairs initialized");
		global.repairs = {};
	}
	for(let key in global.repairs) {
		let target = Game.getObjectById(key);
		if(target && target.hits >= (target.hitsFortify || target.hitsRepair))
			delete global.repairs[key];
		else if(target) {
			global.repairs[key]--;
			if(global.repairs[key] <= 0)
				delete global.repairs[key];
		}
	}

	Object.keys(Game.rooms).forEach(key => Game.rooms[key].run());
	Object.keys(Game.creeps).forEach(key => Game.creeps[key].run());
	Empire.recycle();
}

