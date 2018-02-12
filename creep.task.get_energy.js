// Get energy task looks for an available energy source
// and queues up appropriate mini tasks to get to it, if
// no energy is available, it fails to start.

module.exports = {
	start: function(task) {
		// Order to look for energy
		// 1.) Storage
		// 2.) Containers
		// 3.) Sources

		let droppedEnergy = this.room.find(FIND_DROPPED_RESOURCES, {filter: energy => energy.energy > this.carryCapacity});
		if(droppedEnergy.length) {
			task.subtask = [
				{name: "mini_move", action: "pickup", target_id: droppedEnergy[0].id}
			];
		} else if(this.room.bestContainer && this.room.bestContainer.store.energy >= Math.max(this.carryCapacity, 1500) && !this.memory.idle) {
			// Get energy from best container
			task.subtask = [
				{name: "mini_move", action: "withdraw", target_id: this.room.bestContainer.id, action_params: [RESOURCE_ENERGY]},
			];
		} else if(this.room.storage && this.room.storage.store.energy >= 10000 + this.carryCapacity && !this.memory.idle) {
			// Get energy from storage
			task.subtask = [
				{name: "mini_move", action: "withdraw", target_id: this.room.storage.id, action_params: [RESOURCE_ENERGY]},
			];
		} else if((!this.room.minerCount || !this.storage || this.storage.store.energy < 5000) && (this.memory.claim || this.room.peekClaimSourceMineSpot(1, this))) {
			//Grab a claim if don't already have one
			task.subtask = [ {name: "mine"} ];
		} else {
			delete(this.memory.idle);
			// Try mining in another room
			const exits = Game.map.describeExits(this.room.name);
			let mineRoom = null;
			for(let dir in exits) {
				const roomName = exits[dir];
				const rm = Memory.rooms[roomName];
				if(!rm || (rm.sourceEnergy / rm.sourceCount < 1000 && Game.time < Memory.empire.lastVisited[roomName] + 500 ) ) continue;
				mineRoom = roomName;
				break;
			}

			if(!mineRoom)
				return false; //Nowhere to get energy

			task.subtask = [
				{name: "mini_move", x: 25, y: 25, roomName: mineRoom, min_dist: 22 },
				{name: "mine"},
			];

		}

		//Save subtask info for running
		return true;
	},
	stop: function(task) {
		return true;
	},
	run: function(task) {
		return this.runSubTask(task);
	},
};
