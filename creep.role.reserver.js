module.exports = {
	start: function() {
		if(!this.memory.workRoom) this.memory.workRoom = this.room.name;
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {

	},
};
