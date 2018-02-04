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
		} else if(this.carry.energy === 0 && bestContainer && bestContainer.store.energy > bestContainer.storeCapacity / 2) {
			//Get some energy from best container
			this.assignTask({name: "mini_move", action: "withdraw", target_id: bestContainer.id, action_params: [RESOURCE_ENERGY]});
		} else if(this.carry.energy === 0 && storage) {
			//Get some energy from storage
			this.assignTask({name: "mini_move", action: "withdraw", target_id: storage.id, action_params: [RESOURCE_ENERGY]});
		} else {
			if(bestContainer && bestContainer.store.energy < bestContainer.storeCapacity * 2 / 3) {
				//Find something to do with the energy

				//Maybe fill a tower?
				let tower = this.room.find(FIND_MY_STRUCTURES, {filter: struct => struct.structureType === "tower"}).find(tower => tower.energy < tower.energyCapacity - this.carry.energy);

				if(tower) {
					this.assignTask({name: "mini_move", action: "transfer", target_id: tower.id, action_params: [RESOURCE_ENERGY]});
				} else {
					//Fill an extensions
					let extensions = this.room.find(FIND_MY_STRUCTURES, {filter: struct => struct.structureType === "extension" && struct.energy < struct.energyCapacity});
					if(extensions.length) {
						let extension = extensions[Math.floor(Math.random() * extensions.length)];
						this.assignTask({name: "mini_move", action: "transfer", target_id: extension.id, action_params: [RESOURCE_ENERGY]});
					} else {
						//Drop off energy in storage
						let target = this.room.storage;
						if(this.room.mainSpawn.energy < this.room.mainSpawn.energyCapacity) target = this.room.mainSpawn;
						this.assignTask({name: "mini_move", action: "transfer", target_id: target.id, action_params: [RESOURCE_ENERGY]});
					}
				}
			} else {
				//Drop off energy in storage
				let target = this.room.storage;
				if(this.room.mainSpawn.energy < this.room.mainSpawn.energyCapacity) target = this.room.mainSpawn;
				this.assignTask({name: "mini_move", action: "transfer", target_id: target.id, action_params: [RESOURCE_ENERGY]});
			}
		}
	},
};
