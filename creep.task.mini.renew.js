module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function(task) {
		if(this.ticksToLive > 1400) return "done";
		if(!this.worthKeeping) return "fail";
		return "continue";
	},
};
