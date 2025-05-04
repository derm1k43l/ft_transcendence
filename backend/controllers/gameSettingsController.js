const getUserGameSettings = async (req, reply) => {
	try {
		const { userId } = req.params;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;
		const settings = db.prepare('SELECT * FROM game_settings WHERE user_id = ?').get(userId);

		if (!settings) {
			reply.code(404).send({ message: 'Game settings not found' });
		} else {
			reply.send(settings);
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error retrieving game settings' });
	}
};

const addGameSettings = async (req, reply) => {
	try {
		const {
			user_id,
			board_color = '#000000',
			paddle_color = '#FFFFFF',
			ball_color = '#FFFFFF',
			score_color = '#FFFFFF',
			sound_enabled = 1,
			vibration_enabled = 1,
		} = req.body;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
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
			const result = db.prepare('INSERT INTO game_settings (user_id, board_color, paddle_color, ball_color, score_color, sound_enabled, vibration_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)').run(user_id, board_color, paddle_color, ball_color, score_color, sound_enabled, vibration_enabled);
			const newSettings = db.prepare('SELECT * FROM game_settings WHERE user_id = ?').get(user_id);
			reply.code(201).send(newSettings);
		} catch (err) {
			if (err.message.includes('UNIQUE constraint failed')) {
				reply.code(409).send({ message: 'Game settings already exist for this user' });
			} else if (err.message.includes('FOREIGN KEY constraint failed')) {
				 reply.code(400).send({ message: 'Invalid user_id' });
			} else {
				throw err;
			}
		}
	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error adding game settings' });
	}
};

const updateGameSettings = async (req, reply) => {
	try {
		const { userId } = req.params;
		const { board_color, paddle_color, ball_color, score_color, sound_enabled, vibration_enabled } = req.body;
		// const db = req.server.betterSqlite3;
		// const db = req.betterSqlite3;
		const db = req.server.betterSqlite3;

		let query = 'UPDATE game_settings SET';
		const params = [];
		const fields = { board_color, paddle_color, ball_color, score_color, sound_enabled, vibration_enabled };
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
			const settingsExist = db.prepare('SELECT user_id FROM game_settings WHERE user_id = ?').get(userId);
			if (!settingsExist) {
				reply.code(404).send({ message: 'Game settings not found' });
			} else {
				reply.code(200).send({ message: 'No changes made to game settings' });
			}
		} else {
			const updatedSettings = db.prepare('SELECT * FROM game_settings WHERE user_id = ?').get(userId);
			reply.send(updatedSettings);
		}

	} catch (error) {
		req.log.error(error);
		reply.code(500).send({ message: 'Error updating game settings' });
	}
};

module.exports = {
	getUserGameSettings,
	addGameSettings,
	updateGameSettings,
};
