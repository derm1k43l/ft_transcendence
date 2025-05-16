// Controller for get all Match History (Requires AUTH + Filtering by User/Opponent)
const getMatchHistory = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	try {
		const db = req.server.betterSqlite3;
		const history = db.prepare('SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status FROM match_history WHERE user_id = ? OR opponent_id = ?').all(authenticatedUserId, authenticatedUserId);
		reply.code(200).send(history);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving match history' });
	}
};

// Controller for get single Match History Item (Requires AUTH + Participant Check)
const getMatchHistoryItem = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { id } = req.params;
	try {
		const db = req.server.betterSqlite3;
		const item = db.prepare('SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status FROM match_history WHERE id = ?').get(id);

		if (!item) {
			reply.code(404).send({ message: 'Match history item not found' });
			return;
		}

		// AUTHORIZATION CHECK: Ensure authenticated user is either the user_id or the opponent_id
		if (authenticatedUserId !== item.user_id && authenticatedUserId !== item.opponent_id) {
			reply.code(403).send({ message: 'Forbidden: You can only view match history items you are a part of.' });
			return;
		}

		reply.code(200).send(item);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving match history item' });
	}
};

// Controller for get Match History for a specific user (Requires AUTH + Matching User ID Check)
const getMatchHistoryForUser = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const targetId = parseInt(req.params.userId, 10);

	// AUTHORIZATION CHECK: Ensure the user ID in the URL matches the authenticated user ID
	if (authenticatedUserId !== targetId) {
		reply.code(403).send({ message: 'Forbidden: You can only view your own match history.' });
		return;
	}
	try {
		const db = req.server.betterSqlite3;
		const history = db.prepare('SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status FROM match_history WHERE user_id = ? OR opponent_id = ?').all(authenticatedUserId, authenticatedUserId);
		reply.code(200).send(history);
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user match history' });
	}
};

// Controller for add Match History Item (Requires AUTH - authenticated user is the 'user_id' in the record)
const addMatchHistoryItem = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { opponent_id, opponent_name, result, score, date, duration, game_mode, status } = req.body;
	const db = req.server.betterSqlite3;
	try {
		if (opponent_id !== undefined && opponent_id !== null) {
			const opponentExists = db.prepare('SELECT id FROM users WHERE id = ?').get(opponent_id);
			if (!opponentExists) {
				reply.code(400).send({ message: 'Invalid opponent_id: User not found' });
				return;
			}
		}

		try {
			const resultRun = db.prepare('INSERT INTO match_history (user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
				authenticatedUserId,
				opponent_id || null,
				opponent_name,
				result,
				score,
				date,
				duration || null,
				game_mode,
				status
			);
			const newItemId = resultRun.lastInsertedRowid;
			const newItem = db.prepare('SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status FROM match_history WHERE id = ?').get(newItemId);
			reply.code(201).send(newItem);
		} catch (err) {
			req.log.error(err);
			reply.code(500).send({ message: 'Error adding match history item', error: err.message });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error processing request to add match history item' });
	}
};

// Controller for update Match History Item (Requires AUTH + Ownership Check - authenticated user is the 'user_id')
const updateMatchHistoryItem = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { id } = req.params;
	const updates = req.body;

	if (Object.keys(updates).length === 0) {
		reply.code(400).send({ message: 'No fields provided for update' });
		return;
	}

	// const immutableFields = ['user_id', 'opponent_id', 'date', 'game_mode'];
	// for (const field of immutableFields) {
	// 	if (updates.hasOwnProperty(field)) {
	// 		reply.code(400).send({ message: `Cannot update immutable field: ${field}` });
	// 		return;
	// 	}
	// }

	try {
		const db = req.server.betterSqlite3;

		// fetch item to check ownership
		const item = db.prepare('SELECT id, user_id FROM match_history WHERE id = ?').get(id);

		if (!item) {
			reply.code(404).send({ message: 'Match history item not found.' });
			return;
		}

		if (authenticatedUserId !== item.user_id) {
			reply.code(403).send({ message: 'Forbidden: You can only update your own match history items.' });
			return;
		}

		// Build the updaet query dynamically
		let query = 'UPDATE match_history SET';
		const params = [];
		const allowedFields = [ 'opponent_name', 'result', 'score', 'duration', 'status' ];
		let firstField = true;

		allowedFields.forEach(field => {
			if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
				if (!firstField) {
					query += ',';
				}
				query += ` ${field} = ?`;
				params.push(updates[field]);
				firstField = false;
			}
		});

		if (params.length === 0) {
			reply.code(400).send({ message: 'No fields provided for update' });
			return;
		}

		query += ' WHERE id = ? AND user_id = ?';
		params.push(id);
		params.push(authenticatedUserId);

		const resultRun = db.prepare(query).run(...params);

		if (resultRun.changes === 0) {
			reply.code(200).send({ message: 'No changes made to match history item' });
		} else {
			const updatedItem = db.prepare('SELECT id, user_id, opponent_id, opponent_name, result, score, date, duration, game_mode, status FROM match_history WHERE id = ?').get(id);
			reply.code(200).send(updatedItem);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating match history item' });
	}
};

// Controller for delete Match History Item (Requires AUTH + Ownership Check - authenticated user is the 'user_id')
const deleteMatchHistoryItem = async (req, reply) => {
	const authenticatedUserId = req.user.id;
	const { id } = req.params;
	try {
		const db = req.server.betterSqlite3;

		const item = db.prepare('SELECT user_id FROM match_history WHERE id = ?').get(id);

		if (!item) {
			reply.code(404).send({ message: 'Match history item not found. '});
			return;
		}

		if (authenticatedUserId !== item.user_id) {
			reply.code(403).send({ message: 'Forbidden: You can only delete your own match history items. '});
			return;
		}

		// Delete item
		const result = db.prepare('DELETE FROM match_history WHERE id = ? AND user_id = ?').run(id, authenticatedUserId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'Match history item not found (or does not belong to you)' });
		} else {
			reply.code(200).send({ message: `Match history item ${id} has been removed` });
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
