global.getCPUCost = function(f) {
	let start = Game.cpu.getUsed();
	f();
	return Game.cpu.getUsed() - start;
}

Object.defineProperty(global, 'lotsOfTime', {
	get: function() { return Game.cpu.bucket >= 9000; },
	enumerable: false,
	configurable: true
});
