module.exports.new = (room) => {
	if(!(room instanceof Room)) throw room + " isn't a room!";
	if(room.controller.owner.username != global.username) throw room + " isn't owned by current player!";
	let ret = {
	}
	return ret;
}
