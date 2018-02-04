module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		if(this.ticksToLive > 1400) return "done";
		return "continue";
	},
};
