module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		if(this.task) {
			//Carry on
		} else if(this.carry.energy === 0) {
			//Get some energy from best container
			this.assignTask({name: "mini_move", action: "withdraw", target_id: this.room.bestContainer.id, action_params: [RESOURCE_ENERGY]});
		} else {
			//Drop off energy
			let target = this.room.storage;
			//console.log(claim, this.room.getClaimContainer(claim));
			this.assignTask({name: "mini_move", action: "transfer", target_id: target.id, action_params: [RESOURCE_ENERGY]});
		}
	},
};
