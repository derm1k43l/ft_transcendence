const getMatchHistory = async (req, reply) => {
	try {
		const db = req.server.betterSqlite3;
		const history = db.prepare('SELECT * FROM match_history').all();
		reply.send(history);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving match history' });
	}
};

const getMatchHistoryItem = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;
		const item = db.prepare('SELECT * FROM match_history WHERE id = ?').get(id);

		if (!item) {
			reply.code(404).send({ message: 'Match history item not found' });
		} else {
			reply.send(item);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving match history item' });
	}
};

const getMatchHistoryForUser = async (req, reply) => {
	try {
		const { userId } = req.params;
		const db = req.server.betterSqlite3;
		const history = db.prepare('SELECT * FROM match_history WHERE user_id = ?').all(userId); // Assuming user_id is the primary user in the row
		reply.send(history);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user match history' });
	}
};

const addMatchHistoryItem = async (req, reply) => {
	try {
		const { user_id, opponent_id, opponent_name, result, score, date, duration, game_mode } = req.body;
		const db = req.server.betterSqlite3;

		if (!user_id || !opponent_id || !opponent_name || !result || !score || !date) {
			reply.code(400).send({ message: 'user_id, opponent_id, opponent_name, result, score, and date are required' });
			return;
		}

		// Optional: Check if user_id and opponent_id exist in the users table
		const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
		const opponentExists = db.prepare('SELECT id FROM users WHERE id = ?').get(opponent_id);

		if (!userExists) {
			reply.code(400).send({ message: 'Invalid user_id' });
			return;
		}
		if (!opponentExists) {
			reply.code(400).send({ message: 'Invalid opponent_id' });
			return;
		}


		try {
			const resultRun = db.prepare('INSERT INTO match_history (user_id, opponent_id, opponent_name, result, score, date, duration, game_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(user_id, opponent_id, opponent_name, result, score, date, duration, game_mode);
			const newItemId = resultRun.lastInsertedRowid;
			const newItem = db.prepare('SELECT * FROM match_history WHERE id = ?').get(newItemId);
			reply.code(201).send(newItem);
		} catch (err) {
			req.log.error(err); // Log the actual database error
			reply.code(500).send({ message: 'Error adding match history item', error: err.message });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error processing request to add match history item' });
	}
};

const updateMatchHistoryItem = async (req, reply) => {
	try {
		const { id } = req.params;
		const { user_id, opponent_id, opponent_name, result, score, date, duration, game_mode } = req.body;
		const db = req.server.betterSqlite3;

		let query = 'UPDATE match_history SET';
		const params = [];
		const fields = { user_id, opponent_id, opponent_name, result, score, date, duration, game_mode };
		let firstField = true;

		for (const field in fields) {
			if (fields[field] !== undefined) {
				if (!firstField) {
					query += ',';
				}
				query += ` ${field} = ?`;
				params.push(fields[field]);
				firstField = false;
			}
		}

		if (params.length === 0) {
			reply.code(400).send({ message: 'No fields provided for update' });
			return;
		}

		query += ' WHERE id = ?';
		params.push(id);

		const resultRun = db.prepare(query).run(...params);

		if (resultRun.changes === 0) {
			const itemExists = db.prepare('SELECT id FROM match_history WHERE id = ?').get(id);
			if (!itemExists) {
				reply.code(404).send({ message: 'Match history item not found' });
			} else {
				reply.code(200).send({ message: 'No changes made to match history item' });
			}
		} else {
			const updatedItem = db.prepare('SELECT * FROM match_history WHERE id = ?').get(id);
			reply.send(updatedItem);
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating match history item' });
	}
};

const deleteMatchHistoryItem = async (req, reply) => {
	try {
		const { id } = req.params;
		const db = req.server.betterSqlite3;

		const result = db.prepare('DELETE FROM match_history WHERE id = ?').run(id);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Match history item not found' });
		} else {
			reply.send({ message: `Match history item ${id} has been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting match history item' });
	}
};

module.exports = {
	getMatchHistory,
	getMatchHistoryItem,
	getMatchHistoryForUser,
	addMatchHistoryItem,
	updateMatchHistoryItem,
	deleteMatchHistoryItem,
};
