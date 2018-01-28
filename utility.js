global.getCPUCost = function(f) {
	let start = Game.cpu.getUsed();
	f();
	return Game.cpu.getUsed() - start;
}

