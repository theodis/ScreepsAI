global.creepCost = function(loadout) { return loadout.reduce(((cost,part) => cost + BODYPART_COST[part]),0); }

global.getCPUCost = function(f) {
	let start = Game.cpu.getUsed();
	f();
	return Game.cpu.getUsed() - start;
}

global.distance = function(a,b) {
	let pos_a = a.pos || a;
	let pos_b = b.pos || b;

	if(pos_a.room === pos_b.room)
		return Math.max(Math.abs(pos_a.x - pos_b.x), Math.abs(pos_a.y - pos_b.y));
	return Game.map.findRoute(a.room, b.room).length * 50;
}

global.getNearest = function(pos, targets) {
	if(!targets || !targets.length) return null;
	let ret = null;

	pos = pos.pos || pos;
	if(pos) {
		let min = 99999;

		targets.forEach(target => {
			let dist = distance(pos,target);
			if(dist < min) {
				min = dist;
				ret = target;
			}
		})
	}
	return ret;
}

Object.defineProperty(global, 'lotsOfTime', {
	get: function() { return Game.cpu.bucket >= 1000; },
	enumerable: false,
	configurable: true
});
