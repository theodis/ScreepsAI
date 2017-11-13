Object.values(Game.creeps).forEach(creep => {creep.memory.role = "worker";});
Object.values(Game.creeps).forEach(creep => {creep.memory.energySpot = null;});
Object.values(Game.rooms).forEach(room => {room.memory.availableEnergySpots = [];});
Object.values(Game.rooms).forEach(room => {room.memory.foundEnergySpots = false;});
Object.values(Game.rooms).forEach(room => {room.find(FIND_MY_CONSTRUCTION_SITES).forEach((site) => {site.remove()});})
