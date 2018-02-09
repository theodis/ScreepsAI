Memoize = {}

Memoize.get = function(field, func, target, ttl = 1) {
	let key = "global";
	if(!global.memo) global.memo = {};
	if(!global.memo.ttl) global.memo.ttl = {};
	if(target) key = target.id || target.name;
	if(!global[key]) global[key] = {};
	if(typeof global[key][field] === "undefined" || Game.time > global.memo.ttl[key + ":" + field]) {
		global[key][field] = func();
		global.memo.ttl[key + ":" + field] = Game.time + ttl;
	}
	return global[key][field];
}
