module.exports = {
	start: function() {
		return true;
	},
	stop: function() {
		return true;
	},
	run: function() {
		let bestContainer = this.room.bestContainer;
		let storage = this.room.storage;

		if(this.task) {
			//Carry on
		} else if(this.carry.energy === 0 && bestContainer && bestContainer.store.energy > Math.min(this.carryCapacity * 2, bestContainer.storeCapacity / 2)) {
			//Get some energy from best container
			this.assignTask({name: "mini_move", action: "withdraw", target_id: bestContainer.id, action_params: [RESOURCE_ENERGY]});
		} else if(this.carry.energy === 0 && storage) {
			//Get some energy from storage
			this.assignTask({name: "mini_move", action: "withdraw", target_id: storage.id, action_params: [RESOURCE_ENERGY]});
		} else if(this.carry.energy > 0){
			//Find something to do with the energy

			//Maybe fill a tower?
			let tower = this.room.towersToFill;
			let extensions = this.room.extensionsToFill;
			let mainSpawn = this.room.mainSpawn;

			if(tower) {
				this.assignTask({name: "mini_move", action: "transfer", target_id: tower.id, action_params: [RESOURCE_ENERGY]});
			} else if(extensions.length) {
				//Fill an extensions
				let extension = null;

				//Random extension at max, nearest when not
				if(this.carry.energy === this.carryCapacity)
					extension = extensions[Math.floor(Math.random() * extensions.length)];
				else {
					let min = 9999;
					extensions.forEach(extensioni => {
						let dist = distance(this, extensioni);
						if(dist < min) {
							extension = extensioni;
							min = dist;
						}
					});
				}
				this.assignTask({name: "mini_move", action: "transfer", target_id: extension.id, action_params: [RESOURCE_ENERGY]});
			} else if(mainSpawn && mainSpawn.energy < mainSpawn.energyCapacity) {
				this.assignTask({name: "mini_move", action: "transfer", target_id: mainSpawn.id, action_params: [RESOURCE_ENERGY]});
			} else if(this.room.storage){
				//Drop off energy in storage
				let target = this.room.storage;
				if(this.room.mainSpawn.energy < this.room.mainSpawn.energyCapacity) target = this.room.mainSpawn;
				this.assignTask({name: "mini_move", action: "transfer", target_id: target.id, action_params: [RESOURCE_ENERGY]});
			} else {
				//If no storage then wait by spawn
				this.assignTask({name: "mini_move", target_id: mainSpawn.id});
			}
		}
	},
};
