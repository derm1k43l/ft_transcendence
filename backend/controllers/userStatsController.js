const getUserStat = async (req, reply) => {
	try {
		const { userId } = req.params;
		const db = req.server.betterSqlite3;
		const stat = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);

		if (!stat) {
			reply.code(404).send({ message: 'User stats not found' });
		} else {
			reply.send(stat);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving user stats' });
	}
};

const addUserStat = async (req, reply) => {
	try {
		const { user_id, wins = 0, losses = 0, rank, level = 1 } = req.body;
		const db = req.server.betterSqlite3;

		if (!user_id) {
			reply.code(400).send({ message: 'user_id is required' });
			return;
		}

		// Check if user exists
		const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
		if (!userExists) {
			reply.code(404).send({ message: 'User not found' });
			return;
		}

		try {
			db.prepare('INSERT INTO user_stats (user_id, wins, losses, rank, level) VALUES (?, ?, ?, ?, ?)').run(user_id, wins, losses, rank, level);
			const newUserStat = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(user_id);
			reply.code(201).send(newUserStat);
		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'User stats already exist for this user' });
			} else if (err.message.includes('FOREIGN KEY constraint failed')) {
				reply.code(400).send({ message: 'Invalid user_id' });
			}
			else {
				throw err;
			}
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error adding user stats' });
	}
};

const updateUserStat = async (req, reply) => {
	try {
		const { userId } = req.params;
		const { wins, losses, rank, level } = req.body;
		const db = req.server.betterSqlite3;

		// Build the update query dynamically based on provided fields
		let query = 'UPDATE user_stats SET';
		const params = [];
		const fields = { wins, losses, rank, level };
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

		query += ' WHERE user_id = ?';
		params.push(userId);

		const result = db.prepare(query).run(...params);

		if (result.changes === 0) {
			// Check if the user_id exists to distinguish 404 from no changes
			const userStatExists = db.prepare('SELECT user_id FROM user_stats WHERE user_id = ?').get(userId);
			if (!userStatExists) {
				reply.code(404).send({ message: 'User stats not found' });
			} else {
				reply.code(200).send({ message: 'No changes made to user stats' });
			}
		} else {
			const updatedStat = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
			reply.send(updatedStat);
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating user stats' });
	}
};

const deleteUserStat = async (req, reply) => {
	try {
		const { userId } = req.params;
		const db = req.server.betterSqlite3;

		const result = db.prepare('DELETE FROM user_stats WHERE user_id = ?').run(userId);

		if (result.changes === 0) {
			reply.code(404).send({ message: 'User stats not found' });
		} else {
			reply.send({ message: `User stats for user ${userId} have been removed` });
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error deleting user stats' });
	}
};

module.exports = {
	getUserStat,
	addUserStat,
	updateUserStat,
	deleteUserStat,
};
