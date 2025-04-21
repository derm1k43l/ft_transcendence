
// Controller functions are async Fastify handlers
const getPlayers = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const players = db.prepare('SELECT * FROM players').all();
		reply.send(players);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving players '});
	}
}

const getPlayer = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;
		const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);

		if (!player) {
			reply.code(404).send({ message: 'player not found' });
		} else {
			reply.send(player);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving player' });
	}
}

const addPlayer = async (req, reply) => {
	try {
		const { username } = req.body;
		const db = req.server.betterSqlite3;

		if (!username) {
			reply.code(400).send({ message: 'Username is required' });
			return;
		}

		try {
			const result = db.prepare('INSERT INTO players (username) VALUES (?)').run(username);
			const newPlayerId = result.lastInsertedRowid;
			const newPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(newPlayerId);
			reply.code(201).send(newPlayer);
		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'Username already exists' });
			} else {
				throw err;
			}
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error adding player' });
	}
}

const deletePlayer = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;
	
		const result = db.prepare('DELETE FROM players WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Player not found' });
		} else {
			reply.send({ message: `Player ${id} has been removed` });
		}
	} catch (error) {
		reply.log.error(error);
		reply.code(500).send({ message: 'Error deleting player '});
	}
}

const updatePlayer = async (req, reply) => {
	try {
		const { id } = req.params;
		const { username } = req.body;
	
		const db = req.server.betterSqlite3;
	
		if (!username) {
			reply.code(400).send({ message: 'Username is required for update' });
			return;
		}
	
		try {
			const result = db.prepare('UPDATE players SET username = ? WHERE id = ?').run(username, id);
	
			if (result.changes === 0) {
				reply.code(404).send({ message: 'Player not found' });
			} else {
				const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
				reply.send(updatedPlayer);
			}
		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'Username already exists' });
			} else {
				throw err;
			}
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating player '});
	}
}

module.exports = {
	getPlayers,
	getPlayer,
	addPlayer,
	deletePlayer,
	updatePlayer,
};
